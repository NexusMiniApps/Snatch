// UNIT TESTING EXAMPLES
// ====================================================================

// Example 1: Jest + TypeScript unit test for WebSocket message validation
import { z } from 'zod';
import { validateMessage } from '@/lib/websocket/validator';

const ProductUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  updatedAt: z.string().datetime(),
});

type ProductUpdate = z.infer<typeof ProductUpdateSchema>;

describe('WebSocket Message Validation', () => {
  it('validates correct product update message', () => {
    const validMessage: ProductUpdate = {
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      name: 'Test Product',
      price: 19.99,
      quantity: 42,
      updatedAt: new Date().toISOString(),
    };
    
    const result = validateMessage(validMessage, ProductUpdateSchema);
    expect(result.success).toBe(true);
  });

  it('rejects invalid product update message', () => {
    const invalidMessage = {
      id: 'not-a-uuid',
      name: '',
      price: -10,
      quantity: 3.5, // Should be integer
      updatedAt: 'invalid-date',
    };
    
    const result = validateMessage(invalidMessage, ProductUpdateSchema);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// Example 2: Mocking database connections
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

let prisma: DeepMockProxy<PrismaClient>;

beforeEach(() => {
  prisma = mockDeep<PrismaClient>();
  (PrismaClient as jest.Mock).mockImplementation(() => prisma);
});

test('InventoryService allocates items correctly', async () => {
  // Mock database responses
  prisma.product.findUnique.mockResolvedValue({
    id: '1',
    name: 'Limited Edition Item',
    quantity: 5,
    price: 99.99,
    // other fields...
  });
  
  prisma.inventory.update.mockResolvedValue({
    id: '1',
    productId: '1',
    quantity: 4,
    // other fields...
  });

  const inventoryService = new InventoryService(prisma);
  const result = await inventoryService.allocateItem('1', 1);
  
  expect(result.success).toBe(true);
  expect(prisma.inventory.update).toHaveBeenCalledWith({
    where: { productId: '1' },
    data: { quantity: { decrement: 1 } },
  });
});

// Example 3: PartyKit service mocking
import { mockPartyKitServer } from '@/mocks/partyKit';

test('PartyManager broadcasts updates to all connected clients', async () => {
  const mockServer = mockPartyKitServer();
  const mockConnection1 = { send: jest.fn() };
  const mockConnection2 = { send: jest.fn() };
  
  mockServer.getConnections.mockReturnValue([mockConnection1, mockConnection2]);
  
  const partyManager = new PartyManager(mockServer);
  await partyManager.broadcastUpdate({ type: 'INVENTORY_UPDATE', productId: '123', quantity: 10 });
  
  expect(mockConnection1.send).toHaveBeenCalledWith(expect.stringContaining('INVENTORY_UPDATE'));
  expect(mockConnection2.send).toHaveBeenCalledWith(expect.stringContaining('INVENTORY_UPDATE'));
});

// INTEGRATION TESTING EXAMPLES
// ====================================================================

// Example 4: Cypress test for user journey
// cypress/integration/user-journey.spec.ts
describe('Complete user journey', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/products*').as('getProducts');
    cy.intercept('POST', '/api/cart').as('addToCart');
    cy.intercept('POST', '/api/checkout').as('checkout');
    
    // Mock authentication
    cy.login('test@example.com', 'password123');
  });

  it('should allow a user to browse, add to cart, and checkout', () => {
    // Product browsing
    cy.visit('/products');
    cy.wait('@getProducts');
    cy.get('[data-testid="product-card"]').should('have.length.at.least', 5);
    
    // Product filtering
    cy.get('[data-testid="category-filter"]').select('Electronics');
    cy.wait('@getProducts');
    cy.get('[data-testid="product-card"]').first().as('firstProduct');
    
    // Add to cart
    cy.get('@firstProduct').find('[data-testid="add-to-cart"]').click();
    cy.wait('@addToCart');
    cy.get('[data-testid="cart-count"]').should('contain', '1');
    
    // Checkout process
    cy.visit('/cart');
    cy.get('[data-testid="checkout-button"]').click();
    cy.url().should('include', '/checkout');
    
    // Fill in shipping info
    cy.get('[data-testid="shipping-form"]').within(() => {
      cy.get('input[name="address"]').type('123 Test St');
      cy.get('input[name="city"]').type('Testville');
      cy.get('input[name="zipCode"]').type('12345');
      cy.get('button[type="submit"]').click();
    });
    
    // Confirm and place order
    cy.get('[data-testid="confirm-order"]').click();
    cy.wait('@checkout');
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid="order-number"]').should('exist');
  });
});

// Example 5: API integration test with Jest
// __tests__/api/inventory.test.ts
import { createMocks } from 'node-mocks-http';
import inventoryHandler from '@/pages/api/inventory/[id]';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  }
}));

describe('/api/inventory/[id] endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('updates inventory and handles race conditions correctly', async () => {
    // Mock database responses
    prisma.product.findUnique.mockResolvedValueOnce({
      id: '123',
      name: 'Test Product',
      quantity: 5,
      // other fields...
    });
    
    prisma.product.update.mockResolvedValueOnce({
      id: '123',
      name: 'Test Product',
      quantity: 4,
      // other fields...
    });
    
    const { req, res } = createMocks({
      method: 'PUT',
      query: { id: '123' },
      body: { quantity: 1, operation: 'reserve' },
    });
    
    await inventoryHandler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        success: true,
        inventory: expect.objectContaining({
          id: '123',
          quantity: 4,
        }),
      })
    );
    
    // Verify transaction was used for race condition handling
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

// PERFORMANCE TESTING EXAMPLES
// ====================================================================

// Example 6: k6 load testing script
// k6-scripts/websocket-load.js
import { check } from 'k6';
import ws from 'k6/ws';
import { randomItem } from './helpers.js';

export const options = {
  vus: 1000,  // Virtual users
  duration: '5m',
  thresholds: {
    'ws_connecting_duration': ['p(95)<1000'],  // 95% of connections under 1s
    'ws_session_duration': ['p(95)<30000'],    // 95% of sessions under 30s
    'ws_message_latency': ['p(95)<100'],       // 95% of messages under 100ms
  },
};

const PRODUCT_IDS = [
  'p-001', 'p-002', 'p-003', 'p-004', 'p-005',
  'p-006', 'p-007', 'p-008', 'p-009', 'p-010',
];

export default function() {
  const url = 'wss://api.example.com/inventory-updates';
  
  const res = ws.connect(url, function(socket) {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        productIds: [randomItem(PRODUCT_IDS)],
      }));
    });
    
    socket.on('message', (message) => {
      const startTime = message.subscriptionStartTime || Date.now();
      const latency = Date.now() - startTime;
      
      check(message, {
        'message is valid JSON': (msg) => {
          try {
            JSON.parse(msg);
            return true;
          } catch (e) {
            return false;
          }
        },
      });
      
      // Track metrics
      socket.metrics.add('ws_message_latency', latency);
      
      // Send response to simulate interaction
      if (Math.random() < 0.2) {  // 20% chance to interact
        socket.send(JSON.stringify({
          type: 'VIEW_DETAILS',
          productId: randomItem(PRODUCT_IDS),
          timestamp: Date.now(),
        }));
      }
    });
    
    socket.on('close', () => {
      // Session ended
    });
    
    socket.setTimeout(function() {
      socket.close();
    }, 30000); // 30 second session
  });
  
  check(res, { 'connected successfully': (r) => r && r.status === 101 });
}

// Example 7: Lighthouse performance monitoring script
// lighthouse-runner.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'json',
    port: chrome.port,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  };
  
  const runnerResult = await lighthouse(url, options);
  const reportJson = runnerResult.report;
  
  fs.writeFileSync(`lighthouse-${new Date().toISOString()}.json`, reportJson);
  
  console.log('Performance score:', runnerResult.lhr.categories.performance.score * 100);
  console.log('LCP:', runnerResult.lhr.audits['largest-contentful-paint'].displayValue);
  console.log('TTFB:', runnerResult.lhr.audits['server-response-time'].displayValue);
  console.log('TBT:', runnerResult.lhr.audits['total-blocking-time'].displayValue);
  
  await chrome.kill();
}

// Run against key pages
runLighthouse('https://example.com/');
runLighthouse('https://example.com/products');
runLighthouse('https://example.com/checkout');

// SIMULATION TESTING EXAMPLES
// ====================================================================

// Example 8: Artillery simulation test with custom scenarios
// artillery-scripts/user-behavior.yml
config:
  target: "https://api.example.com"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up phase"
    - duration: 300
      arrivalRate: 20
      rampTo: 100
      name: "Ramp up load"
    - duration: 600
      arrivalRate: 100
      name: "Sustained peak load"
  processor: "./behaviors.js"
  plugins:
    metrics-by-endpoint: {}
  http:
    timeout: 10

scenarios:
  - name: "Browsing products"
    weight: 70
    flow:
      - function: "setJWTToken"
      - get:
          url: "/products"
          headers:
            Authorization: "Bearer {{ jwt }}"
      - think: 3
      - function: "selectRandomCategory"
      - get:
          url: "/products?category={{ category }}"
          headers:
            Authorization: "Bearer {{ jwt }}"
      - think: 5
      - function: "selectRandomProduct"
      - get:
          url: "/products/{{ productId }}"
          headers:
            Authorization: "Bearer {{ jwt }}"
      - think: 7
  
  - name: "Shopping cart flow"
    weight: 20
    flow:
      - function: "setJWTToken"
      - get:
          url: "/products"
          headers:
            Authorization: "Bearer {{ jwt }}"
      - think: 2
      - function: "selectRandomProduct"
      - get:
          url: "/products/{{ productId }}"
          headers:
            Authorization: "Bearer {{ jwt }}"
      - think: 4
      - post:
          url: "/cart"
          headers:
            Authorization: "Bearer {{ jwt }}"
          json:
            productId: "{{ productId }}"
            quantity: "{{ quantity }}"
      - think: 3
      - get:
          url: "/cart"
          headers:
            Authorization: "Bearer {{ jwt }}"
      - function: "decideCheckout"
      - think: 2
      - post:
          url: "/checkout"
          headers:
            Authorization: "Bearer {{ jwt }}"
          json:
            cartId: "{{ cartId }}"
            shippingAddress: "{{ shippingAddress }}"
            paymentMethod: "{{ paymentMethod }}"
          capture:
            - json: "$.orderId"
              as: "orderId"
      - get:
          url: "/orders/{{ orderId }}"
          headers:
            Authorization: "Bearer {{ jwt }}"

  - name: "Real-time monitoring"
    weight: 10
    engine: "ws"
    flow:
      - function: "setJWTToken"
      - connect:
          url: "wss://api.example.com/realtime"
          headers:
            Authorization: "Bearer {{ jwt }}"
      - send:
          message: '{"type":"SUBSCRIBE","products":["{{ productIds }}"]}'
      - think: 30
      - loop:
          - think: 5
          - function: "generateRandomAction"
          - send:
              message: '{{ actionMessage }}'
        count: 10
      - think: 10
      - send:
          message: '{"type":"UNSUBSCRIBE"}'
      - think: 2

// Example 9: Artillery custom behaviors implementation
// artillery-scripts/behaviors.js
module.exports = {
  setJWTToken: (context, events, done) => {
    // Simulate JWT token generation
    context.vars.jwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Math.random().toString(36).substring(2)}`;
    return done();
  },
  
  selectRandomCategory: (context, events, done) => {
    const categories = ['electronics', 'clothing', 'books', 'home', 'sports'];
    context.vars.category = categories[Math.floor(Math.random() * categories.length)];
    return done();
  },
  
  selectRandomProduct: (context, events, done) => {
    // Normally would parse from previous response
    const productIds = [
      'p-001', 'p-002', 'p-003', 'p-004', 'p-005',
      'p-006', 'p-007', 'p-008', 'p-009', 'p-010',
    ];
    context.vars.productId = productIds[Math.floor(Math.random() * productIds.length)];
    context.vars.quantity = Math.floor(Math.random() * 3) + 1;
    return done();
  },
  
  decideCheckout: (context, events, done) => {
    // 70% of users complete checkout
    if (Math.random() < 0.7) {
      context.vars.cartId = `cart-${Math.floor(Math.random() * 100000)}`;
      context.vars.shippingAddress = {
        street: '123 Test St',
        city: 'Testville',
        state: 'TS',
        zipCode: '12345'
      };
      context.vars.paymentMethod = {
        type: 'credit_card',
        last4: '4242'
      };
    } else {
      // Simulate abandoning cart by skipping rest of flow
      return events.emit('done');
    }
    return done();
  },
  
  generateRandomAction: (context, events, done) => {
    const actions = [
      { type: 'VIEW_DETAILS', productId: context.vars.productId },
      { type: 'CHECK_AVAILABILITY', productId: context.vars.productId },
      { type: 'PRICE_WATCH', productId: context.vars.productId, threshold: 99.99 }
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];
    action.timestamp = Date.now();
    context.vars.actionMessage = JSON.stringify(action);
    return done();
  }
};

// LOAD BALANCER AND EDGE NETWORK TESTING
// ====================================================================

// Example 10: Multi-region synthetic monitoring
// monitor-regions.js
const axios = require('axios');
const fs = require('fs');

const REGIONS = [
  { name: 'us-east', endpoint: 'https://us-east.api.example.com' },
  { name: 'us-west', endpoint: 'https://us-west.api.example.com' },
  { name: 'eu-central', endpoint: 'https://eu-central.api.example.com' },
  { name: 'ap-south', endpoint: 'https://ap-south.api.example.com' },
  { name: 'ap-northeast', endpoint: 'https://ap-northeast.api.example.com' },
];

const ENDPOINTS = [
  '/health',
  '/api/products',
  '/api/products/featured',
  '/api/inventory/summary',
];

async function testRegionEndpoint(region, endpoint) {
  const url = `${region.endpoint}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const response = await axios.get(url, { 
      timeout: 5000,
      headers: { 'X-Monitoring': 'true' }
    });
    
    const latency = Date.now() - startTime;
    
    return {
      region: region.name,
      endpoint,
      status: response.status,
      latency,
      success: response.status >= 200 && response.status < 300,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      region: region.name,
      endpoint,
      status: error.response?.status || 0,
      latency: Date.now() - startTime,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function runMonitoring() {
  const results = [];
  
  for (const region of REGIONS) {
    for (const endpoint of ENDPOINTS) {
      const result = await testRegionEndpoint(region, endpoint);
      results.push(result);
      console.log(`${region.name} - ${endpoint}: ${result.success ? '✅' : '❌'} ${result.latency}ms`);
    }
  }
  
  // Log results
  fs.writeFileSync(
    `monitoring-results-${new Date().toISOString().slice(0, 19)}.json`,
    JSON.stringify(results, null, 2)
  );
  
  // Calculate metrics
  const successRate = results.filter(r => r.success).length / results.length;
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const p95Latency = [...results].sort((a, b) => a.latency - b.latency)[Math.floor(results.length * 0.95)].latency;
  
  console.log(`\nResults Summary:`);
  console.log(`Success Rate: ${(successRate * 100).toFixed(2)}%`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`P95 Latency: ${p95Latency}ms`);
  
  // Check for region failures
  const regionResults = {};
  REGIONS.forEach(r => {
    const regionData = results.filter(res => res.region === r.name);
    regionResults[r.name] = {
      successRate: regionData.filter(rd => rd.success).length / regionData.length,
      avgLatency: regionData.reduce((sum, rd) => sum + rd.latency, 0) / regionData.length
    };
  });
  
  console.log('\nRegion Performance:');
  Object.entries(regionResults).forEach(([region, metrics]) => {
    console.log(`${region}: ${(metrics.successRate * 100).toFixed(2)}% success, ${metrics.avgLatency.toFixed(2)}ms avg`);
  });
}

// Run monitoring every 5 minutes
setInterval(runMonitoring, 5 * 60 * 1000);
runMonitoring(); 