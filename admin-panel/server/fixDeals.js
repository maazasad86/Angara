const mongoose = require('mongoose');
require('dotenv').config();
const Deal = require('./models/Deal');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected');
  const deals = await Deal.find();
  let updated = 0;
  for (let deal of deals) {
    if (deal.image && !deal.image.startsWith('http') && !deal.image.startsWith('/')) {
      console.log('Fixing deal:', deal.name, 'with invalid image:', deal.image);
      deal.image = '';
      await deal.save();
      updated++;
    }
  }
  console.log(`Updated ${updated} deals.`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
