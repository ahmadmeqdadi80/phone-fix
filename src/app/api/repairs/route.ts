import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - جلب جميع طلبات الصيانة
export async function GET() {
  try {
    const repairs = await db.repair.findMany({
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(repairs);
  } catch (error) {
    console.error('Error fetching repairs:', error);
    return NextResponse.json({ error: 'Error fetching repairs' }, { status: 500 });
  }
}

// POST - إضافة طلب صيانة جديد
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      deviceType,
      deviceModel,
      entryDate,
      problem,
      diagnosis,
      solution,
      status,
      maintenanceCost,
      finalCost,
      deposit,
      estimatedDate,
      notes,
    } = body;

    if (!customerId || !deviceType || !deviceModel || !problem) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const repair = await db.repair.create({
      data: {
        customerId,
        deviceType,
        deviceModel,
        entryDate: entryDate ? new Date(entryDate) : new Date(),
        problem,
        diagnosis,
        solution,
        status: status || 'PENDING',
        maintenanceCost: maintenanceCost || null,
        finalCost: finalCost || null,
        deposit: deposit || 0,
        paidAmount: 0,
        debt: 0,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
        notes,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(repair);
  } catch (error) {
    console.error('Error creating repair:', error);
    return NextResponse.json({ error: 'Error creating repair' }, { status: 500 });
  }
}

// PUT - تحديث طلب صيانة
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      customerId,
      deviceType,
      deviceModel,
      entryDate,
      problem,
      diagnosis,
      solution,
      status,
      maintenanceCost,
      finalCost,
      deposit,
      paidAmount,
      debt,
      lastPaymentDate,
      estimatedDate,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Repair ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (customerId !== undefined) updateData.customerId = customerId;
    if (deviceType !== undefined) updateData.deviceType = deviceType;
    if (deviceModel !== undefined) updateData.deviceModel = deviceModel;
    if (entryDate !== undefined) updateData.entryDate = new Date(entryDate);
    if (problem !== undefined) updateData.problem = problem;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (solution !== undefined) updateData.solution = solution;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      } else if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
      }
    }
    if (maintenanceCost !== undefined) updateData.maintenanceCost = maintenanceCost;
    if (finalCost !== undefined) updateData.finalCost = finalCost;
    if (deposit !== undefined) updateData.deposit = deposit;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
    if (debt !== undefined) updateData.debt = debt;
    if (lastPaymentDate !== undefined) updateData.lastPaymentDate = lastPaymentDate ? new Date(lastPaymentDate) : null;
    if (estimatedDate !== undefined) updateData.estimatedDate = estimatedDate ? new Date(estimatedDate) : null;
    if (notes !== undefined) updateData.notes = notes;

    const repair = await db.repair.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
      },
    });

    return NextResponse.json(repair);
  } catch (error) {
    console.error('Error updating repair:', error);
    return NextResponse.json({ error: 'Error updating repair' }, { status: 500 });
  }
}

// DELETE - حذف طلب صيانة
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Repair ID is required' }, { status: 400 });
    }

    await db.repair.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repair:', error);
    return NextResponse.json({ error: 'Error deleting repair' }, { status: 500 });
  }
}
