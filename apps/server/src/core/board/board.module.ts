import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './services/board.service';

@Module({
  controllers: [BoardController],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
