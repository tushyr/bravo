# Professional Ledger Database Schema

## Core Accounting Tables

### 1. Chart of Accounts
```sql
CREATE TABLE chart_of_accounts (
    id SERIAL PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
    parent_account_id INTEGER REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Journal Entries (Double-Entry Bookkeeping)
```sql
CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    reference_type ENUM('sale', 'purchase', 'adjustment', 'transfer', 'opening_balance') NOT NULL,
    reference_id INTEGER,
    outlet_id INTEGER REFERENCES outlets(id),
    created_by INTEGER REFERENCES users(id),
    status ENUM('draft', 'posted', 'reversed') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Journal Entry Lines
```sql
CREATE TABLE journal_entry_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES chart_of_accounts(id),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    description TEXT,
    line_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Inventory & Stock Management

### 4. Products/Items
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES product_categories(id),
    unit_of_measure VARCHAR(20) NOT NULL,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    reorder_level INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5. Stock Movements (Real-time tracking)
```sql
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    outlet_id INTEGER REFERENCES outlets(id),
    movement_type ENUM('sale', 'purchase', 'adjustment', 'transfer_in', 'transfer_out', 'waste') NOT NULL,
    quantity_change INTEGER NOT NULL, -- Positive for inbound, negative for outbound
    unit_cost DECIMAL(10,2),
    reference_type VARCHAR(50), -- 'pos_sale', 'manual_adjustment', etc.
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Current Stock Levels (Materialized view for performance)
```sql
CREATE TABLE current_stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    outlet_id INTEGER REFERENCES outlets(id),
    current_quantity INTEGER NOT NULL DEFAULT 0,
    average_cost DECIMAL(10,2),
    last_movement_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(product_id, outlet_id)
);
```

## Outlet Management

### 7. Outlets/Partner Bars
```sql
CREATE TABLE outlets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    outlet_code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    api_key VARCHAR(255) UNIQUE, -- For API authentication
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Real-time Synchronization

### 8. Sync Log
```sql
CREATE TABLE sync_log (
    id SERIAL PRIMARY KEY,
    outlet_id INTEGER REFERENCES outlets(id),
    sync_type ENUM('stock_movement', 'sale', 'inventory_count') NOT NULL,
    data_payload JSON,
    status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
    error_message TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. POS Sales Integration
```sql
CREATE TABLE pos_sales (
    id SERIAL PRIMARY KEY,
    sale_id VARCHAR(100) NOT NULL, -- External POS sale ID
    outlet_id INTEGER REFERENCES outlets(id),
    total_amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    payment_method ENUM('cash', 'card', 'digital', 'mixed') NOT NULL,
    sale_date TIMESTAMP NOT NULL,
    journal_entry_id INTEGER REFERENCES journal_entries(id),
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 10. POS Sale Items
```sql
CREATE TABLE pos_sale_items (
    id SERIAL PRIMARY KEY,
    pos_sale_id INTEGER REFERENCES pos_sales(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Financial Reporting Views

### 11. Account Balances View
```sql
CREATE VIEW account_balances AS
SELECT 
    a.id,
    a.account_code,
    a.account_name,
    a.account_type,
    COALESCE(SUM(jel.debit_amount - jel.credit_amount), 0) as balance,
    MAX(je.entry_date) as last_transaction_date
FROM chart_of_accounts a
LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted'
WHERE a.is_active = true
GROUP BY a.id, a.account_code, a.account_name, a.account_type;
```

### 12. Stock Valuation View
```sql
CREATE VIEW stock_valuation AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    o.id as outlet_id,
    o.name as outlet_name,
    cs.current_quantity,
    cs.average_cost,
    (cs.current_quantity * cs.average_cost) as total_value
FROM products p
JOIN current_stock cs ON p.id = cs.product_id
JOIN outlets o ON cs.outlet_id = o.id
WHERE cs.current_quantity > 0;
```

## Indexes for Performance

```sql
-- Journal entries
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_outlet ON journal_entries(outlet_id);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);

-- Stock movements
CREATE INDEX idx_stock_movements_product_outlet ON stock_movements(product_id, outlet_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX idx_current_stock_product_outlet ON current_stock(product_id, outlet_id);

-- Sync log
CREATE INDEX idx_sync_log_outlet_status ON sync_log(outlet_id, status);
CREATE INDEX idx_sync_log_created_at ON sync_log(created_at);
```

## Triggers for Real-time Updates

### Stock Movement Trigger
```sql
CREATE OR REPLACE FUNCTION update_current_stock()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO current_stock (product_id, outlet_id, current_quantity, last_movement_at)
    VALUES (NEW.product_id, NEW.outlet_id, NEW.quantity_change, NEW.created_at)
    ON CONFLICT (product_id, outlet_id)
    DO UPDATE SET
        current_quantity = current_stock.current_quantity + NEW.quantity_change,
        last_movement_at = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_current_stock
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_current_stock();
```

## API Integration Points

### Real-time Sync Endpoints
- `POST /api/ledger/sync/stock-movement` - Receive stock updates from outlets
- `POST /api/ledger/sync/sale` - Receive POS sale data
- `GET /api/ledger/stock/:outlet_id` - Get current stock levels
- `GET /api/ledger/accounts/balances` - Get account balances
- `POST /api/ledger/journal-entry` - Create manual journal entries

### WebSocket Events for Real-time Updates
- `stock_updated` - Broadcast stock level changes
- `sale_recorded` - Broadcast new sales
- `low_stock_alert` - Alert when stock falls below reorder level
