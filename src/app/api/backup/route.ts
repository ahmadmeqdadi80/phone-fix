import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET - إنشاء نسخة احتياطية
export async function GET() {
  try {
    // جلب جميع البيانات
    const [customers, repairs, inventory, invoices, expenses] = await Promise.all([
      db.customer.findMany(),
      db.repair.findMany({ include: { customer: true } }),
      db.inventory.findMany(),
      db.invoice.findMany({ include: { customer: true } }),
      db.expense.findMany(),
    ]);

    // إنشاء كائن النسخة الاحتياطية
    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      data: {
        customers,
        repairs,
        inventory,
        invoices,
        expenses,
      },
      stats: {
        customersCount: customers.length,
        repairsCount: repairs.length,
        inventoryCount: inventory.length,
        invoicesCount: invoices.length,
        expensesCount: expenses.length,
      },
    };

    return NextResponse.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Error creating backup' }, { status: 500 });
  }
}

// POST - استرجاع النسخة الاحتياطية
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, overwrite } = body;

    if (!data) {
      return NextResponse.json({ error: 'No backup data provided' }, { status: 400 });
    }

    const results = {
      customers: { imported: 0, skipped: 0 },
      repairs: { imported: 0, skipped: 0 },
      inventory: { imported: 0, skipped: 0 },
      invoices: { imported: 0, skipped: 0 },
      expenses: { imported: 0, skipped: 0 },
    };

    // إذا كان الخيار overwrite، نحذف البيانات القديمة أولاً
    if (overwrite) {
      await Promise.all([
        db.expense.deleteMany(),
        db.invoiceItem.deleteMany(),
        db.invoice.deleteMany(),
        db.repairItem.deleteMany(),
        db.repair.deleteMany(),
        db.inventory.deleteMany(),
        db.customer.deleteMany(),
      ]);
    }

    // استيراد العملاء
    if (data.customers && Array.isArray(data.customers)) {
      for (const customer of data.customers) {
        try {
          if (!overwrite) {
            const existing = await db.customer.findUnique({ where: { id: customer.id } });
            if (existing) {
              results.customers.skipped++;
              continue;
            }
          }
          await db.customer.create({
            data: {
              id: customer.id,
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
              notes: customer.notes,
              createdAt: new Date(customer.createdAt),
              updatedAt: new Date(customer.updatedAt),
            },
          });
          results.customers.imported++;
        } catch {
          results.customers.skipped++;
        }
      }
    }

    // استيراد المخزون
    if (data.inventory && Array.isArray(data.inventory)) {
      for (const item of data.inventory) {
        try {
          if (!overwrite) {
            const existing = await db.inventory.findUnique({ where: { id: item.id } });
            if (existing) {
              results.inventory.skipped++;
              continue;
            }
          }
          await db.inventory.create({
            data: {
              id: item.id,
              name: item.name,
              category: item.category,
              brand: item.brand,
              compatibleModels: item.compatibleModels,
              sku: item.sku,
              quantity: item.quantity,
              minQuantity: item.minQuantity,
              costPrice: item.costPrice,
              sellingPrice: item.sellingPrice,
              location: item.location,
              notes: item.notes,
              createdAt: new Date(item.createdAt),
              updatedAt: new Date(item.updatedAt),
            },
          });
          results.inventory.imported++;
        } catch {
          results.inventory.skipped++;
        }
      }
    }

    // استيراد طلبات الصيانة
    if (data.repairs && Array.isArray(data.repairs)) {
      for (const repair of data.repairs) {
        try {
          if (!overwrite) {
            const existing = await db.repair.findUnique({ where: { id: repair.id } });
            if (existing) {
              results.repairs.skipped++;
              continue;
            }
          }
          await db.repair.create({
            data: {
              id: repair.id,
              customerId: repair.customerId,
              deviceType: repair.deviceType,
              deviceModel: repair.deviceModel,
              imei: repair.imei,
              problem: repair.problem,
              diagnosis: repair.diagnosis,
              solution: repair.solution,
              status: repair.status,
              maintenanceCost: repair.maintenanceCost,
              finalCost: repair.finalCost,
              deposit: repair.deposit,
              paidAmount: repair.paidAmount || 0,
              debt: repair.debt || 0,
              receivedAt: new Date(repair.receivedAt),
              estimatedDate: repair.estimatedDate ? new Date(repair.estimatedDate) : null,
              completedAt: repair.completedAt ? new Date(repair.completedAt) : null,
              deliveredAt: repair.deliveredAt ? new Date(repair.deliveredAt) : null,
              notes: repair.notes,
              createdAt: new Date(repair.createdAt),
              updatedAt: new Date(repair.updatedAt),
            },
          });
          results.repairs.imported++;
        } catch {
          results.repairs.skipped++;
        }
      }
    }

    // استيراد الفواتير
    if (data.invoices && Array.isArray(data.invoices)) {
      for (const invoice of data.invoices) {
        try {
          if (!overwrite) {
            const existing = await db.invoice.findUnique({ where: { id: invoice.id } });
            if (existing) {
              results.invoices.skipped++;
              continue;
            }
          }
          await db.invoice.create({
            data: {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              customerId: invoice.customerId,
              repairId: invoice.repairId,
              subtotal: invoice.subtotal,
              discount: invoice.discount,
              tax: invoice.tax,
              total: invoice.total,
              paid: invoice.paid,
              status: invoice.status,
              paymentMethod: invoice.paymentMethod,
              notes: invoice.notes,
              createdAt: new Date(invoice.createdAt),
              updatedAt: new Date(invoice.updatedAt),
            },
          });
          results.invoices.imported++;
        } catch {
          results.invoices.skipped++;
        }
      }
    }

    // استيراد المصاريف
    if (data.expenses && Array.isArray(data.expenses)) {
      for (const expense of data.expenses) {
        try {
          if (!overwrite) {
            const existing = await db.expense.findUnique({ where: { id: expense.id } });
            if (existing) {
              results.expenses.skipped++;
              continue;
            }
          }
          await db.expense.create({
            data: {
              id: expense.id,
              category: expense.category,
              description: expense.description,
              amount: expense.amount,
              date: new Date(expense.date),
              notes: expense.notes,
              createdAt: new Date(expense.createdAt),
              updatedAt: new Date(expense.updatedAt),
            },
          });
          results.expenses.imported++;
        } catch {
          results.expenses.skipped++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم استرجاع النسخة الاحتياطية بنجاح',
      results,
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: 'Error restoring backup' }, { status: 500 });
  }
}
