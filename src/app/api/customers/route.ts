import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - جلب جميع العملاء
export async function GET() {
  try {
    const customers = await db.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Error fetching customers' }, { status: 500 });
  }
}

// POST - إضافة عميل جديد
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, address, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone,
        email,
        address,
        notes,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Error creating customer' }, { status: 500 });
  }
}

// PUT - تحديث عميل
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, phone, email, address, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await db.customer.update({
      where: { id },
      data: {
        name,
        phone,
        email,
        address,
        notes,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Error updating customer' }, { status: 500 });
  }
}

// DELETE - حذف عميل
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    await db.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Error deleting customer' }, { status: 500 });
  }
}
