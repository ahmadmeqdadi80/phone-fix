import { db } from '../src/lib/db';

async function main() {
  console.log('🌱 بدء إدخال البيانات التجريبية...');

  // إنشاء عملاء
  const customers = await Promise.all([
    db.customer.create({
      data: { name: 'أحمد محمد العلي', phone: '0791234567', email: 'ahmed@email.com', address: 'عمان - منطقة الجامعة', notes: 'عميل دائم' }
    }),
    db.customer.create({
      data: { name: 'سارة خالد', phone: '0797654321', email: 'sara@email.com', address: 'الزرقاء', notes: '' }
    }),
    db.customer.create({
      data: { name: 'محمد يوسف', phone: '0799876543', email: '', address: 'إربد', notes: 'يحب الخصومات' }
    }),
    db.customer.create({
      data: { name: 'فاطمة أحمد', phone: '0771234567', email: 'fatima@email.com', address: 'عمان - Abdoun', notes: '' }
    }),
    db.customer.create({
      data: { name: 'عمر حسن', phone: '0789876543', email: '', address: 'السلط', notes: '' }
    }),
  ]);

  console.log('✅ تم إنشاء 5 عملاء');

  // إنشاء طلبات صيانة
  const repairs = await Promise.all([
    db.repair.create({
      data: {
        customerId: customers[0].id,
        deviceType: 'iPhone',
        deviceModel: 'iPhone 14 Pro',
        entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        problem: 'شاشة مكسورة - السقوط على الأرض',
        diagnosis: 'تحتاج تغيير شاشة كاملة',
        solution: 'تم تغيير الشاشة',
        status: 'DELIVERED',
        maintenanceCost: 120,
        finalCost: 200,
        deposit: 50,
        paidAmount: 200,
        debt: 0,
        deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }
    }),
    db.repair.create({
      data: {
        customerId: customers[1].id,
        deviceType: 'Samsung',
        deviceModel: 'Galaxy S23 Ultra',
        entryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        problem: 'البطارية تفرغ بسرعة شديدة',
        diagnosis: 'البطارية تالفة',
        status: 'IN_PROGRESS',
        maintenanceCost: 35,
        finalCost: 80,
        deposit: 20,
        paidAmount: 0,
        debt: 0,
      }
    }),
    db.repair.create({
      data: {
        customerId: customers[2].id,
        deviceType: 'Xiaomi',
        deviceModel: 'Redmi Note 12',
        entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        problem: 'الجهاز لا يشتغل نهائياً',
        diagnosis: 'قيد التشخيص',
        status: 'DIAGNOSING',
        deposit: 0,
        paidAmount: 0,
        debt: 0,
      }
    }),
    db.repair.create({
      data: {
        customerId: customers[3].id,
        deviceType: 'iPhone',
        deviceModel: 'iPhone 13',
        entryDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        problem: 'سماعة الأذن اليسرى لا تعمل',
        diagnosis: 'مشكلة في بورد الصوت',
        solution: 'تم إصلاح الدائرة الكهربائية',
        status: 'DELIVERED',
        maintenanceCost: 25,
        finalCost: 60,
        deposit: 10,
        paidAmount: 30,
        debt: 30,
        deliveredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      }
    }),
    db.repair.create({
      data: {
        customerId: customers[4].id,
        deviceType: 'Huawei',
        deviceModel: 'P50 Pro',
        entryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        problem: 'الكاميرا الخلفية لا تعمل',
        status: 'PENDING',
        deposit: 0,
        paidAmount: 0,
        debt: 0,
      }
    }),
    db.repair.create({
      data: {
        customerId: customers[0].id,
        deviceType: 'Samsung',
        deviceModel: 'Galaxy A54',
        entryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        problem: 'شاشة سوداء والجهاز يشتغل',
        diagnosis: 'إضاءة الشاشة تالفة',
        solution: 'تم تغيير إضاءة LCD',
        status: 'DELIVERED',
        maintenanceCost: 40,
        finalCost: 90,
        deposit: 30,
        paidAmount: 50,
        debt: 40,
        deliveredAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      }
    }),
    db.repair.create({
      data: {
        customerId: customers[2].id,
        deviceType: 'Oppo',
        deviceModel: 'Reno 8',
        entryDate: new Date(),
        problem: 'ميكروفون لا يعمل أثناء المكالمات',
        status: 'PENDING',
        deposit: 0,
        paidAmount: 0,
        debt: 0,
      }
    }),
  ]);

  console.log('✅ تم إنشاء 7 طلبات صيانة');

  // إنشاء مخزون
  await Promise.all([
    db.inventory.create({
      data: { name: 'شاشة iPhone 14 Pro', category: 'شاشات', brand: 'Apple', compatibleModels: 'iPhone 14 Pro', sku: 'SCR-IP14P', quantity: 5, minQuantity: 2, costPrice: 100, sellingPrice: 150, location: 'رف A1' }
    }),
    db.inventory.create({
      data: { name: 'شاشة iPhone 13', category: 'شاشات', brand: 'Apple', compatibleModels: 'iPhone 13', sku: 'SCR-IP13', quantity: 8, minQuantity: 3, costPrice: 80, sellingPrice: 120, location: 'رف A2' }
    }),
    db.inventory.create({
      data: { name: 'بطارية Samsung S23', category: 'بطاريات', brand: 'Samsung', compatibleModels: 'Galaxy S23', sku: 'BAT-S23', quantity: 10, minQuantity: 3, costPrice: 25, sellingPrice: 50, location: 'رف B1' }
    }),
    db.inventory.create({
      data: { name: 'بطارية iPhone 14', category: 'بطاريات', brand: 'Apple', compatibleModels: 'iPhone 14', sku: 'BAT-IP14', quantity: 15, minQuantity: 5, costPrice: 20, sellingPrice: 40, location: 'رف B2' }
    }),
    db.inventory.create({
      data: { name: 'شاحن سريع 25W', category: 'إكسسوارات', brand: 'Samsung', compatibleModels: 'جميع الأجهزة', sku: 'CHR-25W', quantity: 20, minQuantity: 5, costPrice: 8, sellingPrice: 15, location: 'رف C1' }
    }),
    db.inventory.create({
      data: { name: 'سلك USB-C', category: 'إكسسوارات', brand: 'Generic', compatibleModels: 'جميع الأجهزة', sku: 'CAB-USBC', quantity: 30, minQuantity: 10, costPrice: 3, sellingPrice: 8, location: 'رف C2' }
    }),
    db.inventory.create({
      data: { name: 'كفر iPhone 14 Pro', category: 'إكسسوارات', brand: 'Spigen', compatibleModels: 'iPhone 14 Pro', sku: 'CAS-IP14P', quantity: 12, minQuantity: 5, costPrice: 5, sellingPrice: 12, location: 'رف D1' }
    }),
    db.inventory.create({
      data: { name: 'زجاج حماية iPhone', category: 'إكسسوارات', brand: 'Generic', compatibleModels: 'iPhone 13/14', sku: 'GLS-IP', quantity: 25, minQuantity: 10, costPrice: 2, sellingPrice: 5, location: 'رف D2' }
    }),
  ]);

  console.log('✅ تم إنشاء 8 عناصر مخزون');

  // إنشاء مصاريف
  await Promise.all([
    db.expense.create({
      data: { category: 'إيجار', description: 'إيجار المحل - شهر شباط', amount: 300, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
    }),
    db.expense.create({
      data: { category: 'كهرباء', description: 'فاتورة الكهرباء', amount: 45, date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }
    }),
    db.expense.create({
      data: { category: 'ماء', description: 'فاتورة الماء', amount: 15, date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) }
    }),
    db.expense.create({
      data: { category: 'مشتريات', description: 'شراء أدوات صيانة جديدة', amount: 150, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }
    }),
    db.expense.create({
      data: { category: 'رواتب', description: 'راتب الموظف - شباط', amount: 400, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    }),
  ]);

  console.log('✅ تم إنشاء 5 مصاريف');

  // إنشاء فواتير
  await db.invoice.create({
    data: {
      invoiceNumber: 'INV-001',
      customerId: customers[0].id,
      repairId: repairs[0].id,
      subtotal: 200,
      total: 200,
      paid: 200,
      status: 'PAID',
      paymentMethod: 'CASH',
    }
  });

  await db.invoice.create({
    data: {
      invoiceNumber: 'INV-002',
      customerId: customers[3].id,
      repairId: repairs[3].id,
      subtotal: 60,
      total: 60,
      paid: 30,
      status: 'PARTIAL',
      paymentMethod: 'CASH',
    }
  });

  console.log('✅ تم إنشاء 2 فواتير');

  console.log('\n🎉 تم إدخال جميع البيانات التجريبية بنجاح!');
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ خطأ:', e);
    await db.$disconnect();
    process.exit(1);
  });
