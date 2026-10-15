import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardRepo } from '@docmost/db/repos/board/board.repo';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';
import { CreateBoardDto } from '../dto/create-board.dto';
import { UpdateBoardDto } from '../dto/update-board.dto';
import { CreateColumnDto, UpdateColumnDto } from '../dto/column.dto';
import { CreateCardDto, UpdateCardDto } from '../dto/card.dto';
import { Board, Card, UpdatableCard } from '@docmost/db/types/entity.types';
import { PageService } from '../../page/services/page.service';

const DEFAULT_COLUMNS = [
  { name: 'To do', color: '#868e96' },
  { name: 'In progress', color: '#4c6ef5' },
  { name: 'Done', color: '#2f9e44' },
];

@Injectable()
export class BoardService {
  constructor(
    private readonly boardRepo: BoardRepo,
    private readonly pageService: PageService,
  ) {}

  // ---------- boards ----------

  async getBoardsInSpace(spaceId: string) {
    return this.boardRepo.getBoardsInSpace(spaceId);
  }

  async getBoardWithData(boardId: string) {
    const board = await this.boardRepo.findById(boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const [columns, cards] = await Promise.all([
      this.boardRepo.getColumns(boardId),
      this.boardRepo.getCards(boardId),
    ]);

    return { ...board, columns, cards };
  }

  async createBoard(
    userId: string,
    workspaceId: string,
    dto: CreateBoardDto,
  ): Promise<Board> {
    const board = await this.boardRepo.insertBoard({
      title: dto.title,
      description: dto.description,
      icon: dto.icon,
      spaceId: dto.spaceId,
      workspaceId,
      creatorId: userId,
    });

    // seed default columns
    let prevPosition: string | null = null;
    for (const col of DEFAULT_COLUMNS) {
      const position = generateJitteredKeyBetween(prevPosition, null);
      await this.boardRepo.insertColumn({
        boardId: board.id,
        name: col.name,
        color: col.color,
        position,
      });
      prevPosition = position;
    }

    return board;
  }

  async updateBoard(boardId: string, dto: UpdateBoardDto) {
    return this.boardRepo.updateBoard(
      { title: dto.title, description: dto.description, icon: dto.icon },
      boardId,
    );
  }

  async deleteBoard(boardId: string) {
    await this.boardRepo.softDeleteBoard(boardId);
  }

  // ---------- columns ----------

  async createColumn(dto: CreateColumnDto) {
    const lastColumn = await this.boardRepo.getLastColumn(dto.boardId);
    const position = generateJitteredKeyBetween(
      lastColumn?.position ?? null,
      null,
    );

    return this.boardRepo.insertColumn({
      boardId: dto.boardId,
      name: dto.name,
      color: dto.color,
      position,
    });
  }

  async updateColumn(dto: UpdateColumnDto) {
    return this.boardRepo.updateColumn(
      { name: dto.name, color: dto.color },
      dto.columnId,
    );
  }

  async moveColumn(columnId: string, position: string) {
    this.validatePosition(position);
    return this.boardRepo.updateColumn({ position }, columnId);
  }

  async deleteColumn(columnId: string) {
    await this.boardRepo.deleteColumn(columnId);
  }

  // ---------- cards ----------

  async createCard(userId: string, dto: CreateCardDto): Promise<Card> {
    await this.assertColumnInBoard(dto.columnId, dto.boardId);

    const lastCard = await this.boardRepo.getLastCardInColumn(dto.columnId);
    const position = generateJitteredKeyBetween(
      lastCard?.position ?? null,
      null,
    );

    return this.boardRepo.insertCard({
      boardId: dto.boardId,
      columnId: dto.columnId,
      title: dto.title,
      description: dto.description,
      position,
      creatorId: userId,
    });
  }

  async updateCard(dto: UpdateCardDto) {
    // only touch fields that were actually provided, so a title edit doesn't
    // wipe the assignee/description/etc.
    const patch: UpdatableCard = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.assigneeId !== undefined) patch.assigneeId = dto.assigneeId;
    if (dto.dueDate !== undefined) {
      patch.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.labels !== undefined) patch.labels = dto.labels;

    return this.boardRepo.updateCard(patch, dto.cardId);
  }

  async moveCard(cardId: string, columnId: string, position: string) {
    this.validatePosition(position);

    const card = await this.boardRepo.findCardById(cardId);
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    // the target column must belong to the same board as the card, otherwise
    // the card would be orphaned (visible on no board)
    await this.assertColumnInBoard(columnId, card.boardId);

    return this.boardRepo.updateCard({ columnId, position }, cardId);
  }

  private async assertColumnInBoard(columnId: string, boardId: string) {
    const column = await this.boardRepo.findColumnById(columnId);
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    if (column.boardId !== boardId) {
      throw new BadRequestException('Column does not belong to this board');
    }
  }

  async deleteCard(cardId: string) {
    await this.boardRepo.deleteCard(cardId);
  }

  /**
   * Back a card with a full Docmost page so it gets the rich collaborative
   * editor. Creates the page in the board's space and links it to the card.
   */
  async createCardPage(
    userId: string,
    cardId: string,
    opts?: { parentPageId?: string; newParentTitle?: string },
  ): Promise<Card> {
    const card = await this.boardRepo.findCardById(cardId);
    if (!card) {
      throw new NotFoundException('Card not found');
    }
    if (card.pageId) {
      return card;
    }

    const board = await this.boardRepo.findById(card.boardId);
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    let parentPageId = opts?.parentPageId;

    // optionally create a new folder page to house the card's page. The folder
    // itself can be nested under the selected parent.
    const newParentTitle = opts?.newParentTitle?.trim();
    if (newParentTitle) {
      const folder = await this.pageService.create(userId, board.workspaceId, {
        title: newParentTitle,
        spaceId: board.spaceId,
        parentPageId,
      });
      parentPageId = folder.id;
    }

    // PageService.create validates that parentPageId (when given) belongs to
    // the same space, so a card page can only be filed within the board's space.
    const page = await this.pageService.create(userId, board.workspaceId, {
      title: card.title,
      spaceId: board.spaceId,
      parentPageId,
    });

    return this.boardRepo.updateCard({ pageId: page.id }, cardId);
  }

  private validatePosition(position: string) {
    try {
      generateJitteredKeyBetween(position, null);
    } catch {
      throw new BadRequestException('Invalid position');
    }
  }
}
