import { z } from "zod";

// Common validation schemas
export const IdSchema = z.string().min(1, "ID không được để trống");

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Product validation schemas
export const ProductOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Tên tùy chọn không được để trống"),
  price: z.number().min(0, "Giá phải >= 0"),
  basePrice: z.number().min(0, "Giá gốc phải >= 0").optional(),
  stock: z.number().int().min(0, "Tồn kho phải >= 0").default(0),
  isActive: z.boolean().default(true),
});

export const CreateProductSchema = z.object({
  title: z
    .string()
    .min(1, "Tiêu đề không được để trống")
    .max(200, "Tiêu đề quá dài"),
  description: z
    .string()
    .min(1, "Mô tả không được để trống")
    .max(1000, "Mô tả quá dài"),
  longDescription: z.string().max(5000, "Mô tả chi tiết quá dài").optional(),
  price: z.number().min(0, "Giá phải >= 0"),
  currency: z.string().default("VND"),
  category: z.string().min(1, "Danh mục không được để trống"),
  imageEmoji: z.string().min(1, "Icon không được để trống"),
  imageUrl: z
    .string()
    .url("URL hình ảnh không hợp lệ")
    .optional()
    .or(z.literal("")),
  badge: z.string().max(50, "Badge quá dài").optional(),
  originalLink: z
    .string()
    .url("Link gốc không hợp lệ")
    .optional()
    .or(z.literal("")),
  stock: z.number().int().min(0, "Tồn kho phải >= 0").default(0),
  soldCount: z.number().int().min(0, "Số lượng đã bán phải >= 0").optional(),
  isActive: z.boolean().default(true),
  options: z.array(ProductOptionSchema).optional(),
});

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: IdSchema,
});

export const BulkUpdateProductsSchema = z.object({
  productIds: z.array(IdSchema).min(1, "Phải chọn ít nhất 1 sản phẩm"),
  updates: z.object({
    category: z.string().optional(),
    isActive: z.boolean().optional(),
    priceAdjustment: z
      .object({
        type: z.enum(["percentage", "fixed"]),
        value: z.number(),
      })
      .optional(),
  }),
});

// Order validation schemas
export const CreateOrderSchema = z.object({
  productId: IdSchema,
  selectedOptionId: z.string().optional(),
  quantity: z.number().int().min(1, "Số lượng phải >= 1"),
  customerInfo: z.object({
    name: z.string().min(1, "Tên không được để trống"),
    email: z.string().email("Email không hợp lệ").optional(),
    phone: z.string().min(1, "Số điện thoại không được để trống"),
  }),
  note: z.string().max(500, "Ghi chú quá dài").optional(),
});

export const UpdateOrderSchema = z.object({
  id: IdSchema,
  status: z
    .enum(["pending", "processing", "completed", "cancelled"])
    .optional(),
  note: z.string().max(500, "Ghi chú quá dài").optional(),
  adminNote: z.string().max(1000, "Ghi chú admin quá dài").optional(),
});

// User/Auth validation schemas
export const LoginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập không được để trống"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

export const TopupSchema = z.object({
  amount: z
    .number()
    .min(1000, "Số tiền nạp tối thiểu 1,000 VND")
    .max(50000000, "Số tiền nạp tối đa 50,000,000 VND"),
  method: z.enum(["bank_transfer", "momo", "zalopay", "manual"]),
  note: z.string().max(200, "Ghi chú quá dài").optional(),
});

// Analytics validation schemas
export const AnalyticsQuerySchema = z.object({
  period: z.enum(["day", "week", "month", "year"]).default("month"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  category: z.string().optional(),
  productId: z.string().optional(),
});

// Search validation schemas
export const SearchSchema = z
  .object({
    q: z
      .string()
      .min(1, "Từ khóa tìm kiếm không được để trống")
      .max(100, "Từ khóa quá dài"),
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z
      .enum(["price", "name", "created", "popularity"])
      .default("created"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .merge(PaginationSchema);

// Validation helper function
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; error: string; details: z.ZodError } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || "Dữ liệu không hợp lệ",
        details: error,
      };
    }
    return {
      success: false,
      error: "Lỗi xác thực dữ liệu",
      details: error as z.ZodError,
    };
  }
}

// API response helper
export function createValidationErrorResponse(
  error: string,
  details?: z.ZodError
) {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      details: details?.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
