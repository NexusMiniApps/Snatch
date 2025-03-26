// Backend API Implementation for Real-Time Inventory System
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { createPartyServer } from "partykit/server";
import { Server } from "http";
import { z } from "zod";

// Initialize Prisma Client with connection pooling via PgBouncer
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pooling configuration
    connection: {
      pool: {
        min: 5,
        max: 10,
      },
    },
  });
};

// Global prisma instance with type safety
export const prisma = globalThis.prisma || prismaClientSingleton();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// Redis client for caching and pub/sub
const redisClient = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000); // exponential backoff
  },
});

// Pub/Sub channels
const INVENTORY_UPDATE_CHANNEL = "inventory:updates";

// API endpoint handlers
// ====================================================================

// Inventory API handler
export default async function inventoryHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req;

  switch (method) {
    case "GET":
      return getInventory(req, res);
    case "PUT":
      return updateInventory(req, res);
    default:
      res.setHeader("Allow", ["GET", "PUT"]);
      return res.status(405).json({
        success: false,
        message: `Method ${method} Not Allowed`,
      });
  }
}

// GET /api/inventory - Get inventory for multiple products
async function getInventory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        message: "Product IDs are required",
      });
    }

    // Convert to array if single string
    const productIds = Array.isArray(ids) ? ids : [ids];

    // Try to get from Redis cache first
    const cacheKeys = productIds.map((id) => `inventory:${id}`);
    const cachedResults = await redisClient.mget(...cacheKeys);

    const cachedInventory: Record<string, any> = {};
    const missingIds: string[] = [];

    // Process cached results
    productIds.forEach((id, index) => {
      if (cachedResults[index]) {
        try {
          cachedInventory[id] = JSON.parse(cachedResults[index]!);
        } catch (e) {
          missingIds.push(id);
        }
      } else {
        missingIds.push(id);
      }
    });

    let dbProducts: any[] = [];

    // Fetch missing products from database
    if (missingIds.length > 0) {
      dbProducts = await prisma.product.findMany({
        where: {
          id: { in: missingIds },
        },
        select: {
          id: true,
          name: true,
          price: true,
          initialQuantity: true,
          currentQuantity: true,
          category: true,
          updatedAt: true,
        },
      });

      // Cache the results
      const cachePromises = dbProducts.map((product) => {
        return redisClient.set(
          `inventory:${product.id}`,
          JSON.stringify(product),
          "EX",
          300, // 5 minutes expiration
        );
      });

      await Promise.all(cachePromises);

      // Add to the result set
      dbProducts.forEach((product) => {
        cachedInventory[product.id] = product;
      });
    }

    // Convert to array for response
    const products = productIds
      .filter((id) => cachedInventory[id])
      .map((id) => cachedInventory[id]);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Update Inventory Schema
const UpdateInventorySchema = z.object({
  quantity: z.number().int().min(0),
  operation: z.enum(["set", "increment", "decrement"]).default("set"),
});

// PUT /api/inventory/:id - Update inventory for a single product
async function updateInventory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required",
      });
    }

    // Validate request body
    const validationResult = UpdateInventorySchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: validationResult.error.format(),
      });
    }

    const { quantity, operation } = validationResult.data;

    // Use transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Get current product
      const product = await tx.product.findUnique({
        where: { id },
        select: {
          id: true,
          currentQuantity: true,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // Calculate new quantity based on operation
      let newQuantity: number;

      switch (operation) {
        case "increment":
          newQuantity = product.currentQuantity + quantity;
          break;
        case "decrement":
          newQuantity = Math.max(0, product.currentQuantity - quantity);
          break;
        default: // 'set'
          newQuantity = quantity;
      }

      // Update the product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentQuantity: newQuantity },
        select: {
          id: true,
          name: true,
          price: true,
          initialQuantity: true,
          currentQuantity: true,
          category: true,
          updatedAt: true,
        },
      });

      return updatedProduct;
    });

    // Update Redis cache
    await redisClient.set(
      `inventory:${result.id}`,
      JSON.stringify(result),
      "EX",
      300, // 5 minutes expiration
    );

    // Publish update to Redis channel for real-time subscribers
    await redisClient.publish(
      INVENTORY_UPDATE_CHANNEL,
      JSON.stringify({
        type: "INVENTORY_UPDATE",
        productId: result.id,
        newQuantity: result.currentQuantity,
        timestamp: new Date().toISOString(),
      }),
    );

    return res.status(200).json({
      success: true,
      inventory: result,
    });
  } catch (error) {
    console.error("Error updating inventory:", error);

    if (error instanceof Error && error.message === "Product not found") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// PartyKit Real-Time Server
// ====================================================================

// Connection message schema
const ConnectionMessageSchema = z.object({
  type: z.enum(["SUBSCRIBE", "UNSUBSCRIBE", "PING"]),
  productIds: z.array(z.string()).optional(),
  timestamp: z.string().datetime(),
});

export const inventoryParty = createPartyServer({
  async onConnect(connection, { request }) {
    // Authenticate connection
    const token = new URL(request.url).searchParams.get("token");

    // Simple authentication (in a real app, verify JWT, etc.)
    if (process.env.NODE_ENV === "production" && !token) {
      connection.close(4000, "Authentication required");
      return;
    }

    // Store which products this connection is subscribed to
    connection.setState({ subscribedProducts: [] });

    // Send welcome message
    connection.send(
      JSON.stringify({
        type: "CONNECTED",
        message: "Connected to real-time inventory service",
        timestamp: new Date().toISOString(),
      }),
    );

    // Setup Redis subscriber for this connection
    const subscriber = new Redis(process.env.REDIS_URL!);

    // Subscribe to inventory updates
    await subscriber.subscribe(INVENTORY_UPDATE_CHANNEL);

    // Handle Redis messages
    subscriber.on("message", (channel, message) => {
      if (channel === INVENTORY_UPDATE_CHANNEL) {
        try {
          const update = JSON.parse(message);
          const subscribedProducts = connection.state?.subscribedProducts || [];

          // Only forward messages for products this connection cares about
          if (subscribedProducts.includes(update.productId)) {
            connection.send(message);
          }
        } catch (err) {
          console.error("Error processing Redis message:", err);
        }
      }
    });

    // Clean up Redis subscriber when connection closes
    connection.on("close", () => {
      subscriber.unsubscribe(INVENTORY_UPDATE_CHANNEL);
      subscriber.quit();
    });
  },

  async onMessage(message, connection) {
    try {
      const data = JSON.parse(message);
      const validationResult = ConnectionMessageSchema.safeParse(data);

      if (!validationResult.success) {
        connection.send(
          JSON.stringify({
            type: "ERROR",
            message: "Invalid message format",
            errors: validationResult.error.format(),
            timestamp: new Date().toISOString(),
          }),
        );
        return;
      }

      const validMessage = validationResult.data;

      switch (validMessage.type) {
        case "SUBSCRIBE":
          if (validMessage.productIds && validMessage.productIds.length > 0) {
            // Update subscription list
            connection.setState({
              subscribedProducts: validMessage.productIds,
            });

            connection.send(
              JSON.stringify({
                type: "SUBSCRIBED",
                productIds: validMessage.productIds,
                timestamp: new Date().toISOString(),
              }),
            );
          }
          break;

        case "UNSUBSCRIBE":
          // Clear subscriptions
          connection.setState({ subscribedProducts: [] });

          connection.send(
            JSON.stringify({
              type: "UNSUBSCRIBED",
              timestamp: new Date().toISOString(),
            }),
          );
          break;

        case "PING":
          // Respond to keep connection alive
          connection.send(
            JSON.stringify({
              type: "PONG",
              timestamp: new Date().toISOString(),
            }),
          );
          break;

        default:
          connection.send(
            JSON.stringify({
              type: "ERROR",
              message: "Unsupported message type",
              timestamp: new Date().toISOString(),
            }),
          );
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);

      connection.send(
        JSON.stringify({
          type: "ERROR",
          message: "Failed to process message",
          timestamp: new Date().toISOString(),
        }),
      );
    }
  },

  async onError(error, connection) {
    console.error("WebSocket error:", error);

    if (connection) {
      connection.send(
        JSON.stringify({
          type: "ERROR",
          message: "Server error occurred",
          timestamp: new Date().toISOString(),
        }),
      );
    }
  },
});

// Monitoring and Health Check
// ====================================================================

// GET /api/health - Health check endpoint for load balancers
export async function healthCheckHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    const redisStatus = await redisClient.ping();

    return res.status(200).json({
      status: "ok",
      database: "connected",
      redis: redisStatus === "PONG" ? "connected" : "error",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(500).json({
      status: "error",
      message: "Service unhealthy",
      timestamp: new Date().toISOString(),
    });
  }
}
