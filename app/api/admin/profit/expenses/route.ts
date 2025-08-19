import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/src/core/admin-auth";
import { dataStore } from "@/src/core/data-store";
import { ExpenseCategory } from "@/src/core/profit";

export async function GET(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageProducts");
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") as ExpenseCategory | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const expenses = dataStore.getExpenses(category || undefined, start, end);

    // Calculate summary statistics
    const summary = {
      total: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      count: expenses.length,
      byCategory: {} as Record<ExpenseCategory, { total: number; count: number }>,
    };

    // Group by category
    expenses.forEach(expense => {
      if (!summary.byCategory[expense.category]) {
        summary.byCategory[expense.category] = { total: 0, count: 0 };
      }
      summary.byCategory[expense.category].total += expense.amount;
      summary.byCategory[expense.category].count += 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        expenses,
        summary,
      },
    });
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch expenses",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check admin permission
  const authResult = await requireAdminPermission(request, "canManageProducts");
  if (authResult instanceof NextResponse) return authResult;
  
  const admin = authResult;

  try {
    const expenseData = await request.json();

    // Validate required fields
    if (!expenseData.category || !expenseData.description || !expenseData.amount || !expenseData.date) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: category, description, amount, date",
        },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories: ExpenseCategory[] = [
      "cogs", "operational", "marketing", "administrative", "transaction_fees", "other"
    ];
    
    if (!validCategories.includes(expenseData.category)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid expense category",
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (typeof expenseData.amount !== 'number' || expenseData.amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be a positive number",
        },
        { status: 400 }
      );
    }

    // Create expense
    const expense = dataStore.createExpense({
      category: expenseData.category,
      description: expenseData.description,
      amount: expenseData.amount,
      date: new Date(expenseData.date),
      isRecurring: expenseData.isRecurring || false,
      recurringPeriod: expenseData.recurringPeriod,
      allocatedToProducts: expenseData.allocatedToProducts || [],
      createdBy: admin.id,
      metadata: expenseData.metadata || {},
    });

    // Log the activity
    dataStore.logActivity({
      adminId: admin.id,
      adminName: admin.name,
      action: "create_expense",
      targetType: "system",
      targetId: expense.id,
      description: `Tạo chi phí mới: ${expense.description} - ${expense.amount.toLocaleString('vi-VN')}₫`,
      metadata: {
        category: expense.category,
        amount: expense.amount,
      },
    });

    return NextResponse.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create expense",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // Check admin permission
  const authResult = await requireAdminPermission(request, "canManageProducts");
  if (authResult instanceof NextResponse) return authResult;
  
  const admin = authResult;

  try {
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Expense ID is required",
        },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (updates.amount !== undefined && (typeof updates.amount !== 'number' || updates.amount <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Amount must be a positive number",
        },
        { status: 400 }
      );
    }

    // Update expense
    const updatedExpense = dataStore.updateExpense(id, updates);

    if (!updatedExpense) {
      return NextResponse.json(
        {
          success: false,
          error: "Expense not found",
        },
        { status: 404 }
      );
    }

    // Log the activity
    dataStore.logActivity({
      adminId: admin.id,
      adminName: admin.name,
      action: "update_expense",
      targetType: "system",
      targetId: updatedExpense.id,
      description: `Cập nhật chi phí: ${updatedExpense.description}`,
      metadata: {
        updates,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedExpense,
    });
  } catch (error) {
    console.error("Update expense error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update expense",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Check admin permission
  const authResult = await requireAdminPermission(request, "canManageProducts");
  if (authResult instanceof NextResponse) return authResult;
  
  const admin = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Expense ID is required",
        },
        { status: 400 }
      );
    }

    // Get expense details before deletion for logging
    const expenses = dataStore.getExpenses();
    const expense = expenses.find(e => e.id === id);

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          error: "Expense not found",
        },
        { status: 404 }
      );
    }

    // Delete expense
    const deleted = dataStore.deleteExpense(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete expense",
        },
        { status: 500 }
      );
    }

    // Log the activity
    dataStore.logActivity({
      adminId: admin.id,
      adminName: admin.name,
      action: "delete_expense",
      targetType: "system",
      targetId: id,
      description: `Xóa chi phí: ${expense.description} - ${expense.amount.toLocaleString('vi-VN')}₫`,
      metadata: {
        category: expense.category,
        amount: expense.amount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete expense",
      },
      { status: 500 }
    );
  }
}
