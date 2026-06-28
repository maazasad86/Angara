require('dotenv').config();
const mongoose = require('mongoose');
const Item = require('./models/Item');
const Category = require('./models/Category');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/angara')
  .then(async () => {
    console.log('Connected to DB');
    const items = await Item.find().populate('category');
    let updatedCount = 0;

    for (let item of items) {
      const catName = item.category?.name?.toLowerCase() || '';
      const itemName = item.name.toLowerCase();
      const combinedString = `${catName} ${itemName}`;

      let newType = 'Fast Food';

      if (combinedString.includes('desi') || combinedString.includes('bbq') || combinedString.includes('roll') || combinedString.includes('kebab') || combinedString.includes('boti') || combinedString.includes('tikka') || combinedString.includes('karahi') || combinedString.includes('handi') || combinedString.includes('malai') || combinedString.includes('bihari') || combinedString.includes('seekh') || combinedString.includes('chops')) {
        newType = 'BBQ';
      } else if (combinedString.includes('drink') || combinedString.includes('water') || combinedString.includes('pepsi') || combinedString.includes('coke') || combinedString.includes('sprite') || combinedString.includes('mineral') || combinedString.includes('dew') || combinedString.includes('7up') || combinedString.includes('fanta') || combinedString.includes('mirinda')) {
        newType = 'Drinks/Extras';
      }

      if (item.kitchenType !== newType) {
        item.kitchenType = newType;
        await item.save();
        updatedCount++;
      }
    }
    console.log(`Migration complete. Updated ${updatedCount} items.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
