import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './services/board.service';
import { BoardRepo } from '@docmost/db/repos/board/board.repo';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Workspace } from '@docmost/db/types/entity.types';
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from '../casl/interfaces/space-ability.type';
import SpaceAbilityFactory from '../casl/abilities/space-ability.factory';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardIdDto, CardIdDto, ColumnIdDto, SpaceIdDto } from './dto/board.dto';
import { CreateColumnDto, MoveColumnDto, UpdateColumnDto } from './dto/column.dto';
import {
  CreateCardDto,
  CreateCardPageDto,
  MoveCardDto,
  UpdateCardDto,
} from './dto/card.dto';

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardController {
  constructor(
    private readonly boardService: BoardService,
    private readonly boardRepo: BoardRepo,
    private readonly spaceAbility: SpaceAbilityFactory,
  ) {}

  /** Resolve the space a board belongs to and assert the user's ability. */
  private async assertBoardAbility(
    user: User,
    boardId: string,
    action: SpaceCaslAction,
  ) {
    const board = await this.boardRepo.findById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    const ability = await this.spaceAbility.createForUser(user, board.spaceId);
    if (ability.cannot(action, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }
    return board;
  }

  private async boardIdForColumn(columnId: string): Promise<string> {
    const column = await this.boardRepo.findColumnById(columnId);
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    return column.boardId;
  }

  private async boardIdForCard(cardId: string): Promise<string> {
    const card = await this.boardRepo.findCardById(cardId);
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    return card.boardId;
  }

  // ---------- boards ----------

  @HttpCode(HttpStatus.OK)
  @Post('/list')
  async list(@Body() dto: SpaceIdDto, @AuthUser() user: User) {
    const ability = await this.spaceAbility.createForUser(user, dto.spaceId);
    if (ability.cannot(SpaceCaslAction.Read, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }
    return this.boardService.getBoardsInSpace(dto.spaceId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/info')
  async info(@Body() dto: BoardIdDto, @AuthUser() user: User) {
    await this.assertBoardAbility(user, dto.boardId, SpaceCaslAction.Read);
    return this.boardService.getBoardWithData(dto.boardId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/create')
  async create(
    @Body() dto: CreateBoardDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    const ability = await this.spaceAbility.createForUser(user, dto.spaceId);
    if (ability.cannot(SpaceCaslAction.Create, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }
    return this.boardService.createBoard(user.id, workspace.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/update')
  async update(@Body() dto: UpdateBoardDto, @AuthUser() user: User) {
    await this.assertBoardAbility(user, dto.boardId, SpaceCaslAction.Edit);
    return this.boardService.updateBoard(dto.boardId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/delete')
  async delete(@Body() dto: BoardIdDto, @AuthUser() user: User) {
    await this.assertBoardAbility(user, dto.boardId, SpaceCaslAction.Manage);
    await this.boardService.deleteBoard(dto.boardId);
  }

  // ---------- columns ----------

  @HttpCode(HttpStatus.OK)
  @Post('/column/create')
  async createColumn(@Body() dto: CreateColumnDto, @AuthUser() user: User) {
    await this.assertBoardAbility(user, dto.boardId, SpaceCaslAction.Edit);
    return this.boardService.createColumn(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/column/update')
  async updateColumn(@Body() dto: UpdateColumnDto, @AuthUser() user: User) {
    const boardId = await this.boardIdForColumn(dto.columnId);
    await this.assertBoardAbility(user, boardId, SpaceCaslAction.Edit);
    return this.boardService.updateColumn(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/column/move')
  async moveColumn(@Body() dto: MoveColumnDto, @AuthUser() user: User) {
    const boardId = await this.boardIdForColumn(dto.columnId);
    await this.assertBoardAbility(user, boardId, SpaceCaslAction.Edit);
    return this.boardService.moveColumn(dto.columnId, dto.position);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/column/delete')
  async deleteColumn(@Body() dto: ColumnIdDto, @AuthUser() user: User) {
    const boardId = await this.boardIdForColumn(dto.columnId);
    await this.assertBoardAbility(user, boardId, SpaceCaslAction.Edit);
    await this.boardService.deleteColumn(dto.columnId);
  }

  // ---------- cards ----------

  @HttpCode(HttpStatus.OK)
  @Post('/card/create')
  async createCard(@Body() dto: CreateCardDto, @AuthUser() user: User) {
    await this.assertBoardAbility(user, dto.boardId, SpaceCaslAction.Edit);
    return this.boardService.createCard(user.id, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/card/update')
  async updateCard(@Body() dto: UpdateCardDto, @AuthUser() user: User) {
    const boardId = await this.boardIdForCard(dto.cardId);
    await this.assertBoardAbility(user, boardId, SpaceCaslAction.Edit);
    return this.boardService.updateCard(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/card/move')
  async moveCard(@Body() dto: MoveCardDto, @AuthUser() user: User) {
    const boardId = await this.boardIdForCard(dto.cardId);
    await this.assertBoardAbility(user, boardId, SpaceCaslAction.Edit);
    return this.boardService.moveCard(dto.cardId, dto.columnId, dto.position);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/card/delete')
  async deleteCard(@Body() dto: CardIdDto, @AuthUser() user: User) {
    const boardId = await this.boardIdForCard(dto.cardId);
    await this.assertBoardAbility(user, boardId, SpaceCaslAction.Edit);
    await this.boardService.deleteCard(dto.cardId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/card/create-page')
  async createCardPage(
    @Body() dto: CreateCardPageDto,
    @AuthUser() user: User,
  ) {
    const boardId = await this.boardIdForCard(dto.cardId);
    await this.assertBoardAbility(user, boardId, SpaceCaslAction.Edit);
    return this.boardService.createCardPage(user.id, dto.cardId, {
      parentPageId: dto.parentPageId,
      newParentTitle: dto.newParentTitle,
    });
  }
}
