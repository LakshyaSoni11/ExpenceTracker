exports.addExpense = async (req, res) => {
  const { description, amount, paidBy, groupId, splitType, participants } = req.body;
  let splits = [];

  if (splitType === 'EQUAL') {
    const share = amount / participants.length;
    splits = participants.map(p => ({ user: p.userId, amount: share }));
  } 
  else if (splitType === 'PERCENT') {
    splits = participants.map(p => ({ 
      user: p.userId, 
      amount: (p.percent / 100) * amount 
    }));
  }
  // ... EXACT logic follows simple assignment

  const newExpense = new Expense({ description, amount, paidBy, groupId, splitType, splits });
  await newExpense.save();
  res.status(201).json(newExpense);
};