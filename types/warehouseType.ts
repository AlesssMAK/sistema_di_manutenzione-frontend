import { STATUS } from '@/constants/status';

export type MovementType = 'in' | 'out' | 'adjust';
export type ReferenceType = 'fault' | 'task' | 'transfer' | 'none';

export interface Pagination {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/* -------------------------------- Unit --------------------------------- */

export interface Unit {
  _id: string;
  code: string;
  name: string;
  // Piece-like units (pezzo) stay integer; continuous ones (litri, kg,
  // metri, centimetri) allow fractional quantities.
  allowsDecimals: boolean;
  status: STATUS;
}

export interface UnitsData {
  units: Unit[];
  pagination: Pagination;
}

export interface UnitsResponse {
  success: boolean;
  message: string;
  data: UnitsData;
}

export interface CreateUnitRequest {
  code: string;
  name: string;
  allowsDecimals?: boolean;
}

export interface UpdateUnit {
  code?: string;
  name?: string;
  allowsDecimals?: boolean;
  status?: STATUS;
}

export interface UpdateUnitRequest {
  unitId: string;
  data: UpdateUnit;
}

/* ------------------------------ Category ------------------------------- */

export interface Category {
  _id: string;
  name: string;
  status: STATUS;
}

export interface CategoriesData {
  categories: Category[];
  pagination: Pagination;
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: CategoriesData;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategory {
  name?: string;
  status?: STATUS;
}

export interface UpdateCategoryRequest {
  categoryId: string;
  data: UpdateCategory;
}

// Populated ({ _id, name }) on item read; a plain id string on write.
export type CategoryRef = Pick<Category, '_id' | 'name'>;

/* ------------------------------ Warehouse ------------------------------ */

export interface Warehouse {
  _id: string;
  code: string;
  name: string;
  location?: string;
  status: STATUS;
}

export interface WarehousesData {
  warehouses: Warehouse[];
  pagination: Pagination;
}

export interface WarehousesResponse {
  success: boolean;
  message: string;
  data: WarehousesData;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  location?: string;
}

export interface UpdateWarehouse {
  code?: string;
  name?: string;
  location?: string;
  status?: STATUS;
}

export interface UpdateWarehouseRequest {
  warehouseId: string;
  data: UpdateWarehouse;
}

/* --------------------------- Inventory item ---------------------------- */

// unitId comes back populated ({ code, name, allowsDecimals }) on
// list/read, but is a plain id string on write.
export type UnitRef = Pick<Unit, '_id' | 'code' | 'name' | 'allowsDecimals'>;

export interface InventoryItem {
  _id: string;
  code: string;
  name: string;
  // Populated ({ _id, name }) on read, a plain id on write.
  categoryId?: CategoryRef | string;
  unitId: UnitRef | string;
  // Optional package intake: when set, Carico can be entered in whole
  // packages (packageLabel) and is expanded by unitsPerPackage into the
  // usage unit. Consumption always uses the usage unit.
  packageLabel?: string;
  unitsPerPackage?: number;
  note?: string;
  status: STATUS;
}

export interface ItemsData {
  items: InventoryItem[];
  pagination: Pagination;
}

export interface ItemsResponse {
  success: boolean;
  message: string;
  data: ItemsData;
}

export interface CreateItemRequest {
  code: string;
  name: string;
  categoryId?: string;
  unitId: string;
  packageLabel?: string;
  unitsPerPackage?: number;
  note?: string;
}

export interface UpdateItem {
  code?: string;
  name?: string;
  categoryId?: string | null;
  unitId?: string;
  packageLabel?: string | null;
  unitsPerPackage?: number | null;
  note?: string;
  status?: STATUS;
}

export interface UpdateItemRequest {
  itemId: string;
  data: UpdateItem;
}

/* ------------------------------- Stock --------------------------------- */

export type ItemRef = Pick<
  InventoryItem,
  | '_id'
  | 'code'
  | 'name'
  | 'categoryId'
  | 'unitId'
  | 'packageLabel'
  | 'unitsPerPackage'
  | 'status'
>;
export type WarehouseRef = Pick<Warehouse, '_id' | 'code' | 'name'>;

export interface StockLevel {
  _id: string;
  itemId: ItemRef | string;
  warehouseId: WarehouseRef | string;
  quantity: number;
  minLevel: number;
  updatedAt?: string;
}

export interface StockData {
  levels: StockLevel[];
  pagination: Pagination;
}

export interface StockResponse {
  success: boolean;
  message: string;
  data: StockData;
}

export interface StockQuery {
  warehouseId?: string;
  itemId?: string;
  categoryId?: string;
  search?: string;
  lowOnly?: boolean;
  page?: number;
  perPage?: number;
}

/* ----------------------------- Movements ------------------------------- */

export interface MovementReference {
  type: ReferenceType;
  faultId?: string;
  label?: string;
}

export interface StockMovement {
  _id: string;
  itemId: ItemRef | string;
  warehouseId: WarehouseRef | string;
  type: MovementType;
  quantity: number;
  userName: string;
  reference?: MovementReference;
  note?: string;
  batchId?: string;
  createdAt: string;
}

export interface MovementsData {
  movements: StockMovement[];
  pagination: Pagination;
}

export interface MovementsResponse {
  success: boolean;
  message: string;
  data: MovementsData;
}

export interface MovementsQuery {
  itemId?: string;
  warehouseId?: string;
  faultId?: string;
  type?: MovementType;
  page?: number;
  perPage?: number;
}

// One line of a batch in/out operation.
export interface MovementLine {
  itemId: string;
  quantity: number;
}

export interface StockInRequest {
  warehouseId: string;
  lines: MovementLine[];
  note?: string;
}

export interface StockOutRequest {
  warehouseId: string;
  lines: MovementLine[];
  reference?: MovementReference;
  note?: string;
}

export interface StockAdjustRequest {
  warehouseId: string;
  itemId: string;
  quantity: number;
  note?: string;
}

export interface StockTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  lines: MovementLine[];
  note?: string;
}

export interface StockOutWarning {
  itemId: string;
  name?: string;
  quantity: number;
  minLevel: number;
  negative: boolean;
}

export interface StockMutationResult {
  batchId?: string;
  results: { itemId: string; name?: string; quantity: number }[];
  warnings?: StockOutWarning[];
}
