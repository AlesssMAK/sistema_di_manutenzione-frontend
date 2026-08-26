import nextServer from './api';
import { getAllUsers } from './users';
import type { GrantedUser, UserPermissions } from '@/types/userTypes';
import type {
  Category,
  CategoriesResponse,
  CreateCategoryRequest,
  CreateItemRequest,
  CreateUnitRequest,
  CreateWarehouseRequest,
  InventoryItem,
  UpdateCategoryRequest,
  ItemsResponse,
  MovementsQuery,
  MovementsResponse,
  StockAdjustRequest,
  StockTransferRequest,
  StockInRequest,
  StockMinResult,
  StockMutationResult,
  StockOutRequest,
  StockSetMinRequest,
  StockQuery,
  StockResponse,
  Unit,
  UnitsResponse,
  UpdateItemRequest,
  UpdateUnitRequest,
  UpdateWarehouseRequest,
  Warehouse,
  WarehousesResponse,
} from '@/types/warehouseType';
import type { STATUS } from '@/constants/status';

interface ListParams {
  search?: string;
  status?: STATUS | string;
  page?: number;
  perPage?: number;
}

interface ItemListParams extends ListParams {
  categoryId?: string;
}

/* --------------------- Permission grant helpers ------------------------ */
// Who currently holds a warehouse grant. Derived client-side from the
// active-user roster so the admin can manage grants even while the
// module is switched off (the /warehouse API is blocked then).
const getUsersWithPermission = async (
  flag: keyof UserPermissions
): Promise<GrantedUser[]> => {
  const { users } = await getAllUsers({ status: 'active', perPage: 200 });
  return users
    .filter((u) => u.permissions?.[flag] === true)
    .map((u) => ({ _id: u._id, fullName: u.fullName, role: u.role }));
};

export const getWarehouseManagers = () =>
  getUsersWithPermission('canManageWarehouse');

export const getWarehouseOperators = () =>
  getUsersWithPermission('canOperateWarehouse');

/* -------------------------------- Units -------------------------------- */

export const getAllUnits = async (params: ListParams = {}) => {
  const res = await nextServer.get<UnitsResponse>('/warehouse/units', {
    params,
  });
  return res.data.data;
};

export const createUnit = async (data: CreateUnitRequest) => {
  const res = await nextServer.post<{ data: Unit }>('/warehouse/units', data);
  return res.data.data;
};

export const updateUnit = async ({ unitId, data }: UpdateUnitRequest) => {
  const res = await nextServer.put<{ data: Unit }>(
    `/warehouse/units/${unitId}`,
    data
  );
  return res.data.data;
};

export const deleteUnit = async (unitId: string) => {
  const res = await nextServer.delete(`/warehouse/units/${unitId}`);
  return res.data;
};

/* ------------------------------ Warehouses ----------------------------- */

/* ----------------------------- Categories ------------------------------ */

export const getAllCategories = async (params: ListParams = {}) => {
  const res = await nextServer.get<CategoriesResponse>(
    '/warehouse/categories',
    { params }
  );
  return res.data.data;
};

export const createCategory = async (data: CreateCategoryRequest) => {
  const res = await nextServer.post<{ data: Category }>(
    '/warehouse/categories',
    data
  );
  return res.data.data;
};

export const updateCategory = async ({
  categoryId,
  data,
}: UpdateCategoryRequest) => {
  const res = await nextServer.put<{ data: Category }>(
    `/warehouse/categories/${categoryId}`,
    data
  );
  return res.data.data;
};

export const deleteCategory = async (categoryId: string) => {
  const res = await nextServer.delete(`/warehouse/categories/${categoryId}`);
  return res.data;
};

export const getAllWarehouses = async (params: ListParams = {}) => {
  const res = await nextServer.get<WarehousesResponse>(
    '/warehouse/warehouses',
    { params }
  );
  return res.data.data;
};

export const createWarehouse = async (data: CreateWarehouseRequest) => {
  const res = await nextServer.post<{ data: Warehouse }>(
    '/warehouse/warehouses',
    data
  );
  return res.data.data;
};

export const updateWarehouse = async ({
  warehouseId,
  data,
}: UpdateWarehouseRequest) => {
  const res = await nextServer.put<{ data: Warehouse }>(
    `/warehouse/warehouses/${warehouseId}`,
    data
  );
  return res.data.data;
};

export const deleteWarehouse = async (warehouseId: string) => {
  const res = await nextServer.delete(`/warehouse/warehouses/${warehouseId}`);
  return res.data;
};

/* --------------------------- Inventory items --------------------------- */

export const getAllItems = async (params: ItemListParams = {}) => {
  const res = await nextServer.get<ItemsResponse>('/warehouse/items', {
    params,
  });
  return res.data.data;
};

export const getItemByCode = async (code: string) => {
  const res = await nextServer.get<{ data: InventoryItem }>(
    `/warehouse/items/by-code/${encodeURIComponent(code)}`
  );
  return res.data.data;
};

export const createItem = async (data: CreateItemRequest) => {
  const res = await nextServer.post<{ data: InventoryItem }>(
    '/warehouse/items',
    data
  );
  return res.data.data;
};

export const updateItem = async ({ itemId, data }: UpdateItemRequest) => {
  const res = await nextServer.put<{ data: InventoryItem }>(
    `/warehouse/items/${itemId}`,
    data
  );
  return res.data.data;
};

export const deleteItem = async (itemId: string) => {
  const res = await nextServer.delete(`/warehouse/items/${itemId}`);
  return res.data;
};

/* ------------------------------- Stock --------------------------------- */

export const getStock = async (params: StockQuery = {}) => {
  const res = await nextServer.get<StockResponse>('/warehouse/stock', {
    params,
  });
  return res.data.data;
};

export const getMovements = async (params: MovementsQuery = {}) => {
  const res = await nextServer.get<MovementsResponse>('/warehouse/movements', {
    params,
  });
  return res.data.data;
};

export const stockIn = async (data: StockInRequest) => {
  const res = await nextServer.post<{ data: StockMutationResult }>(
    '/warehouse/movements/in',
    data
  );
  return res.data.data;
};

export const stockOut = async (data: StockOutRequest) => {
  const res = await nextServer.post<{ data: StockMutationResult }>(
    '/warehouse/movements/out',
    data
  );
  return res.data.data;
};

export const stockAdjust = async (data: StockAdjustRequest) => {
  const res = await nextServer.post<{ data: StockMutationResult }>(
    '/warehouse/movements/adjust',
    data
  );
  return res.data.data;
};

export const stockTransfer = async (data: StockTransferRequest) => {
  const res = await nextServer.post<{ data: StockMutationResult }>(
    '/warehouse/movements/transfer',
    data
  );
  return res.data.data;
};

export const stockSetMin = async (data: StockSetMinRequest) => {
  const res = await nextServer.patch<{ data: StockMinResult }>(
    '/warehouse/stock/min',
    data
  );
  return res.data.data;
};
