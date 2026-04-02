import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - جلب جميع الفواتير
export async function GET() {
  try {
    const invoices = await db.invoice.findMany({
      include: {
        customer: true,
        repair: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Error fetching invoices' }, { status: 500 });
  }
}

// POST - إنشاء فاتورة جديدة
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      invoiceNumber,
      customerId,
      repairId,
      items,
      subtotal,
      discount,
      tax,
      total,
      status,
      notes,
    } = body;

    if (!invoiceNumber || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerId: customerId || null,
        repairId: repairId || null,
        subtotal: subtotal || 0,
        discount: discount || 0,
        tax: tax || 0,
        total: total || 0,
        paid: 0,
        status: status || 'PENDING',
        notes,
        items: {
          create: items.map((item: { description: string; quantity: number; unitPrice: number; total: number }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Error creating invoice' }, { status: 500 });
  }
}

// PUT - تحديث فاتورة
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, paid, status, paymentMethod } = body;

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (paid !== undefined) updateData.paid = paid;
    if (status !== undefined) updateData.status = status;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

    const invoice = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Error updating invoice' }, { status: 500 });
  }
}

// DELETE - حذف فاتورة
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // حذف عناصر الفاتورة أولاً
    await db.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    // ثم حذف الفاتورة
    await db.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Error deleting invoice' }, { status: 500 });
  }
}
