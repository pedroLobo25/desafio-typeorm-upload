// import AppError from '../errors/AppError';

import { getRepository, getCustomRepository } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute(data: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoriesRepository = getRepository(Category);

    let category_id = '';

    // Verifica o tipo da transaction
    if (!['income', 'outcome'].includes(data.type)) {
      throw new Error('Type not allowed.');
    }

    const { total } = await transactionsRepository.getBalance();

    if (data.type === 'outcome') {
      // checa se tem saldo suficiente
      if (total - data.value <= 0) {
        throw new AppError('Insufficient funds.', 400);
      }
    }
    // Procurar a categoria antes
    const categoryFound = await categoriesRepository.findOne({
      where: { title: data.category },
    });

    if (!categoryFound) {
      // cria categoria
      const categoryCreated = await categoriesRepository.create({
        title: data.category,
      });

      await categoriesRepository.save(categoryCreated);

      category_id = categoryCreated.id;
    } else {
      category_id = categoryFound.id;
    }

    const transaction = await transactionsRepository.create({
      title: data.title,
      value: data.value,
      type: data.type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
