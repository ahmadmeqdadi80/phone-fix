import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - جلب جميع المصاريف
export async function GET() {
  try {
    const expenses = await db.expense.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Error fetching expenses' }, { status: 500 });
  }
}

// POST - إضافة مصروف جديد
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, description, amount, date, notes } = body;

    if (!category || !description || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expense = await db.expense.create({
      data: {
        category,
        description,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        notes,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Error creating expense' }, { status: 500 });
  }
}

// PUT - تحديث مصروف
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, category, description, amount, date, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (date !== undefined) updateData.date = new Date(date);
    if (notes !== undefined) updateData.notes = notes;

    const expense = await db.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Error updating expense' }, { status: 500 });
  }
}

// DELETE - حذف مصروف
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });
    }

    await db.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Error deleting expense' }, { status: 500 });
  }
}
