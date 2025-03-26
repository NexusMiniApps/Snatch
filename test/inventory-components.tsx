// Types and interfaces
import { useState, useEffect, useCallback, useMemo } from "react";
import { z } from "zod";

// Inventory type definitions
export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
  initialQuantity: z.number().int().min(0),
  currentQuantity: z.number().int().min(0),
  category: z.string(),
  imageUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;

// WebSocket message schemas
export const WebSocketMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("INVENTORY_UPDATE"),
    productId: z.string().uuid(),
    newQuantity: z.number().int().min(0),
    timestamp: z.string().datetime(),
  }),
  z.object({
    type: z.literal("PRODUCT_VIEW"),
    productId: z.string().uuid(),
    userId: z.string().uuid().optional(),
    timestamp: z.string().datetime(),
  }),
  z.object({
    type: z.literal("CART_UPDATE"),
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    action: z.enum(["ADD", "REMOVE"]),
    timestamp: z.string().datetime(),
  }),
]);

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// Connection state hook
export const useWebSocketConnection = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      setLastError(null);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      setLastError("WebSocket connection error");
      setIsConnected(false);
    };

    setSocket(ws);

    // Clean up on unmount
    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback(
    (message: object) => {
      if (socket && isConnected) {
        socket.send(JSON.stringify(message));
        return true;
      }
      return false;
    },
    [socket, isConnected],
  );

  return { socket, isConnected, lastError, sendMessage };
};

// Real-time inventory hook
export const useRealTimeInventory = (productIds: string[], wsUrl: string) => {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection
  const { socket, isConnected, lastError, sendMessage } =
    useWebSocketConnection(wsUrl);

  // Initial data load
  useEffect(() => {
    const fetchInitialInventory = async () => {
      try {
        setIsLoading(true);
        const queryParams = new URLSearchParams();
        productIds.forEach((id) => queryParams.append("ids", id));

        const response = await fetch(
          `/api/inventory?${queryParams.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch initial inventory data");
        }

        const data = await response.json();
        const inventoryMap: Record<string, number> = {};

        data.products.forEach((product: Product) => {
          inventoryMap[product.id] = product.currentQuantity;
        });

        setInventory(inventoryMap);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (productIds.length > 0) {
      fetchInitialInventory();
    } else {
      setIsLoading(false);
    }
  }, [productIds]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        const result = WebSocketMessageSchema.safeParse(message);

        if (!result.success) {
          console.error("Invalid WebSocket message format", result.error);
          return;
        }

        const validMessage = result.data;

        if (
          validMessage.type === "INVENTORY_UPDATE" &&
          productIds.includes(validMessage.productId)
        ) {
          setInventory((prev) => ({
            ...prev,
            [validMessage.productId]: validMessage.newQuantity,
          }));
        }
      } catch (err) {
        console.error("Error processing WebSocket message", err);
      }
    };

    socket.addEventListener("message", handleMessage);

    // Subscribe to inventory updates for these products
    sendMessage({
      type: "SUBSCRIBE",
      productIds,
      timestamp: new Date().toISOString(),
    });

    return () => {
      socket.removeEventListener("message", handleMessage);

      // Unsubscribe when component unmounts or productIds change
      sendMessage({
        type: "UNSUBSCRIBE",
        productIds,
        timestamp: new Date().toISOString(),
      });
    };
  }, [socket, isConnected, productIds, sendMessage]);

  // Process WebSocket errors
  useEffect(() => {
    if (lastError) {
      setError(lastError);
    }
  }, [lastError]);

  return {
    inventory,
    isLoading,
    error,
    isConnected,
  };
};

// Components
// ====================================================================

// Inventory Status Badge Component
export const InventoryStatusBadge: React.FC<{
  quantity: number;
  lowThreshold?: number;
  className?: string;
}> = ({ quantity, lowThreshold = 5, className = "" }) => {
  const status = useMemo(() => {
    if (quantity <= 0) return "out-of-stock";
    if (quantity <= lowThreshold) return "low-stock";
    return "in-stock";
  }, [quantity, lowThreshold]);

  const baseClasses =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

  const statusClasses = {
    "out-of-stock": "bg-red-100 text-red-800",
    "low-stock": "bg-yellow-100 text-yellow-800",
    "in-stock": "bg-green-100 text-green-800",
  };

  const statusText = {
    "out-of-stock": "Out of Stock",
    "low-stock": `Low Stock (${quantity})`,
    "in-stock": `In Stock (${quantity})`,
  };

  return (
    <span
      className={`${baseClasses} ${statusClasses[status]} ${className}`}
      data-testid="inventory-status"
    >
      {statusText[status]}
    </span>
  );
};

// Real-Time Product Card Component
export const RealTimeProductCard: React.FC<{
  product: Product;
  wsUrl: string;
  onAddToCart: (productId: string, quantity: number) => void;
  className?: string;
}> = ({ product, wsUrl, onAddToCart, className = "" }) => {
  const { inventory, isLoading, error, isConnected } = useRealTimeInventory(
    [product.id],
    wsUrl,
  );
  const [quantity, setQuantity] = useState(1);

  const currentQuantity = inventory[product.id] ?? product.currentQuantity;
  const isAvailable = currentQuantity > 0;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuantity(parseInt(e.target.value, 10));
  };

  const handleAddToCart = () => {
    if (isAvailable && quantity <= currentQuantity) {
      onAddToCart(product.id, quantity);
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {product.imageUrl && (
        <div className="aspect-w-1 aspect-h-1 w-full">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover object-center"
          />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
          {product.description}
        </p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-lg font-medium text-gray-900">
            ${product.price.toFixed(2)}
          </p>

          <div className="flex items-center">
            {isLoading ? (
              <span className="text-sm text-gray-500">Loading...</span>
            ) : error ? (
              <span className="text-sm text-red-500">
                Error loading inventory
              </span>
            ) : (
              <InventoryStatusBadge quantity={currentQuantity} />
            )}

            {!isConnected && (
              <span
                className="ml-2 h-2 w-2 rounded-full bg-red-500"
                title="Real-time updates disconnected"
              ></span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center space-x-2">
          <select
            value={quantity}
            onChange={handleQuantityChange}
            disabled={!isAvailable}
            className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
            data-testid="quantity-select"
          >
            {[...Array(Math.min(10, currentQuantity || 0))].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>

          <button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium text-white ${
              isAvailable
                ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                : "cursor-not-allowed bg-gray-300"
            }`}
            data-testid="add-to-cart"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

// Product Gallery with Real-Time Updates
export const RealTimeProductGallery: React.FC<{
  initialProducts: Product[];
  wsUrl: string;
  onAddToCart: (productId: string, quantity: number) => void;
  className?: string;
}> = ({ initialProducts, wsUrl, onAddToCart, className = "" }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const productIds = useMemo(() => products.map((p) => p.id), [products]);

  const { inventory, isLoading, error, isConnected } = useRealTimeInventory(
    productIds,
    wsUrl,
  );

  // Update product quantities based on real-time inventory
  useEffect(() => {
    if (isLoading || error || Object.keys(inventory).length === 0) return;

    setProducts((prev) =>
      prev.map((product) => ({
        ...product,
        currentQuantity: inventory[product.id] ?? product.currentQuantity,
      })),
    );
  }, [inventory, isLoading, error]);

  return (
    <div className={className}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>

        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-500">
            Real-time updates: {isConnected ? "Connected" : "Disconnected"}
          </span>
          <span
            className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            aria-hidden="true"
          ></span>
        </div>
      </div>

      {isLoading && products.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
          <button
            className="mt-2 text-sm text-red-700 underline"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-gray-500">No products available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <RealTimeProductCard
              key={product.id}
              product={product}
              wsUrl={wsUrl}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Inventory Management Dashboard Component
export const InventoryManagementDashboard: React.FC<{
  wsUrl: string;
  className?: string;
}> = ({ wsUrl, className = "" }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [updateQuantity, setUpdateQuantity] = useState<number>(0);

  const productIds = useMemo(() => products.map((p) => p.id), [products]);
  const { inventory, isConnected } = useRealTimeInventory(productIds, wsUrl);

  // Initial data fetch
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/products");

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Update products with real-time inventory data
  useEffect(() => {
    if (Object.keys(inventory).length > 0) {
      setProducts((prev) =>
        prev.map((product) => ({
          ...product,
          currentQuantity: inventory[product.id] ?? product.currentQuantity,
        })),
      );
    }
  }, [inventory]);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProduct(productId);

    if (productId) {
      const product = products.find((p) => p.id === productId);
      if (product) {
        setUpdateQuantity(product.currentQuantity);
      }
    } else {
      setUpdateQuantity(0);
    }
  };

  const handleUpdateInventory = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/admin/inventory/${selectedProduct}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity: updateQuantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update inventory");
      }

      // The actual update will come through the WebSocket connection
      // No need to manually update the state here
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Sort products by inventory level (low to high)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aQuantity = inventory[a.id] ?? a.currentQuantity;
      const bQuantity = inventory[b.id] ?? b.currentQuantity;
      return aQuantity - bQuantity;
    });
  }, [products, inventory]);

  return (
    <div className={`rounded-lg bg-white p-6 shadow-md ${className}`}>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Inventory Management
        </h2>

        <div className="flex items-center">
          <span className="mr-2 text-sm text-gray-500">
            Status: {isConnected ? "Connected" : "Disconnected"}
          </span>
          <span
            className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            aria-hidden="true"
          ></span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Loading inventory data...</p>
        </div>
      ) : error ? (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : (
        <>
          {/* Inventory Update Form */}
          <div className="mb-6 rounded-md bg-gray-50 p-4">
            <h3 className="text-md mb-4 font-medium text-gray-700">
              Update Inventory
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="productSelect"
                  className="block text-sm font-medium text-gray-700"
                >
                  Select Product
                </label>
                <select
                  id="productSelect"
                  value={selectedProduct || ""}
                  onChange={handleProductSelect}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">-- Select a product --</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} (
                      {inventory[product.id] ?? product.currentQuantity}{" "}
                      available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="quantityInput"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Quantity
                </label>
                <input
                  id="quantityInput"
                  type="number"
                  min="0"
                  value={updateQuantity}
                  onChange={(e) =>
                    setUpdateQuantity(
                      Math.max(0, parseInt(e.target.value) || 0),
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  disabled={!selectedProduct}
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleUpdateInventory}
                  disabled={!selectedProduct}
                  className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white ${
                    selectedProduct
                      ? "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      : "cursor-not-allowed bg-gray-300"
                  }`}
                >
                  Update Inventory
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Product
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Stock Level
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedProducts.map((product) => {
                  const currentQuantity =
                    inventory[product.id] ?? product.currentQuantity;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {product.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {product.category}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {currentQuantity} / {product.initialQuantity}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <InventoryStatusBadge quantity={currentQuantity} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
