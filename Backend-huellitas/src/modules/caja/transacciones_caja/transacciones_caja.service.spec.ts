import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TransaccionesCajaService } from './transacciones_caja.service';
import { TransaccionCaja } from './entities/transacciones_caja.entity';

describe('TransaccionesCajaService', () => {
  let service: TransaccionesCajaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransaccionesCajaService,
        {
          provide: getRepositoryToken(TransaccionCaja),
          useValue: { find: jest.fn(), findOne: jest.fn(), save: jest.fn(), manager: { getRepository: jest.fn() } },
        },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<TransaccionesCajaService>(TransaccionesCajaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
