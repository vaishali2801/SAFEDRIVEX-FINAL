const Reward = require('../models/Reward');

const seedRewards = async () => {
  try {
    await Reward.deleteMany({});

    const rewards = [
      {
        name: 'Coffee Coupon',
        description: 'Free coffee at partner cafes',
        pointsRequired: 500,
        category: 'FOOD',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300',
        stock: 100,
        isActive: true,
        validUntil: new Date('2026-12-31'),
        terms: 'Valid at participating cafes only. One per visit.',
      },
      {
        name: 'Fuel Cashback ₹200',
        description: '₹200 cashback on fuel purchase',
        pointsRequired: 1000,
        category: 'FUEL',
        image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300',
        stock: 50,
        isActive: true,
        validUntil: new Date('2026-12-31'),
        terms: 'Valid at partner fuel stations. Minimum ₹500 purchase.',
      },
      {
        name: 'Shopping Voucher ₹500',
        description: '₹500 voucher for online shopping',
        pointsRequired: 2000,
        category: 'SHOPPING',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300',
        stock: 30,
        isActive: true,
        validUntil: new Date('2026-12-31'),
        terms: 'Valid on partner e-commerce platforms. Minimum order ₹1000.',
      },
      {
        name: 'Free Vehicle Service',
        description: 'Complimentary vehicle maintenance service',
        pointsRequired: 3000,
        category: 'SERVICE',
        image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300',
        stock: 20,
        isActive: true,
        validUntil: new Date('2026-12-31'),
        terms: 'Valid at authorized service centers. Covers basic service only.',
      },
      {
        name: 'Insurance Discount 10%',
        description: '10% discount on vehicle insurance renewal',
        pointsRequired: 5000,
        category: 'INSURANCE',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300',
        stock: 10,
        isActive: true,
        validUntil: new Date('2026-12-31'),
        terms: 'Valid for one policy renewal. Terms and conditions apply.',
      },
      {
        name: 'Premium Car Wash',
        description: 'Premium car wash and detailing',
        pointsRequired: 800,
        category: 'SERVICE',
        image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=300',
        stock: 40,
        isActive: true,
        validUntil: new Date('2026-12-31'),
        terms: 'Valid at partner car wash centers.',
      },
      {
        name: 'Snack Combo',
        description: 'Snack combo at highway restaurants',
        pointsRequired: 300,
        category: 'FOOD',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300',
        stock: 200,
        isActive: true,
        validUntil: new Date('2026-12-31'),
        terms: 'Valid at participating highway restaurants.',
      },
    ];

    await Reward.insertMany(rewards);
    console.log('✓ Rewards seeded');
    return rewards;
  } catch (error) {
    console.error('Reward seed error:', error);
    throw error;
  }
};

module.exports = seedRewards;