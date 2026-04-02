import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - جلب جميع المخزون
export async function GET() {
  try {
    const inventory = await db.inventory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Error fetching inventory' }, { status: 500 });
  }
}

// POST - إضافة منتج جديد
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      category,
      brand,
      compatibleModels,
      sku,
      quantity,
      minQuantity,
      costPrice,
      sellingPrice,
      location,
      notes,
    } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 });
    }

    const item = await db.inventory.create({
      data: {
        name,
        category,
        brand,
        compatibleModels,
        sku,
        quantity: quantity || 0,
        minQuantity: minQuantity || 5,
        costPrice: costPrice || 0,
        sellingPrice: sellingPrice || 0,
        location,
        notes,
      },
    });

    // إضافة سجل حركة المخزون
    if (quantity && quantity > 0) {
      await db.stockHistory.create({
        data: {
          inventoryId: item.id,
          type: 'IN',
          quantity: quantity,
          reason: 'رصيد افتتاحي',
        },
      });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Error creating inventory item' }, { status: 500 });
  }
}

// PUT - تحديث منتج
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      category,
      brand,
      compatibleModels,
      sku,
      quantity,
      minQuantity,
      costPrice,
      sellingPrice,
      location,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Inventory ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (brand !== undefined) updateData.brand = brand;
    if (compatibleModels !== undefined) updateData.compatibleModels = compatibleModels;
    if (sku !== undefined) updateData.sku = sku;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (minQuantity !== undefined) updateData.minQuantity = minQuantity;
    if (costPrice !== undefined) updateData.costPrice = costPrice;
    if (sellingPrice !== undefined) updateData.sellingPrice = sellingPrice;
    if (location !== undefined) updateData.location = location;
    if (notes !== undefined) updateData.notes = notes;

    const item = await db.inventory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json({ error: 'Error updating inventory item' }, { status: 500 });
  }
}

// DELETE - حذف منتج
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Inventory ID is required' }, { status: 400 });
    }

    await db.inventory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json({ error: 'Error deleting inventory item' }, { status: 500 });
  }
}
