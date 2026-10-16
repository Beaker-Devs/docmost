import { Module } from '@nestjs/common';
import { BoardController } from './board.controller';
import { BoardService } from './services/board.service';
import { PageModule } from '../page/page.module';

@Module({
  controllers: [BoardController],
  providers: [BoardService],
  exports: [BoardService],
  imports: [PageModule],
})
export class BoardModule {}
