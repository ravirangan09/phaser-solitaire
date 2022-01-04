
import { Scene, Math } from 'phaser';
import cardImages from './assets/*.svg';
import Card from './Card';

const GUTTER = 20;
const VSHIFT = 20;
const HSHIFT = 30;
const DRAW_COUNT = 3;

export default class SolitaireGame extends Scene
{
	constructor()
	{
		super('solitaire-game')
	}

	preload()
  {
    for(const key in cardImages) {
      this.load.svg(key, cardImages[key])   
    }
  }

  renderFoundationSection() {
    const w = this.firstCard.width;
    const h = this.firstCard.height;

    let x = GUTTER+w/2
    let y = GUTTER+h/2
    this.foundationSection = [];
    for(let i=0;i<4;i++) {
      this.add.rectangle(x,y, w, h).setStrokeStyle(1, 0x3D3D3D);
      this.foundationSection.push({ stack: [], pos: { x, y }, 
                                    ruleValue: 1, 
                                    ruleSuites: 'CDHS' 
                                  });
      x += (w + GUTTER);
    }
  }

  renderDrawSection() {
    const w = this.firstCard.width;
    const h = this.firstCard.height;

    const frameNames = Object.keys(cardImages)
    frameNames.splice(frameNames.indexOf('BACK'), 1)
    this.currentSet = Math.RND.shuffle(frameNames)

    const y = this.foundationSection[3].pos.y;
    let x = this.foundationSection[3].pos.x + (w + GUTTER)*2;

    this.playSection = [ { stack: [],  pos: { x, y } } ];
    x += w + GUTTER;
    this.drawSection =  [{ stack: [], pos: { x, y } } ];

    this.firstCard.setLocation('reset', 0)
    this.add.rectangle(x, y, w, h).setStrokeStyle(1, 0x3D3D3D)
      .setInteractive().setData('card', this.firstCard)

    for(let i=0;i<this.currentSet.length;i++) {
      const card = new Card(this, this.currentSet[i]);
      card.setPos(x, y, false)
      card.setLocation('draw', 0)
      this.drawSection[0].stack.push(card)
    }
  }

  async renderColumnSection() {
    const w = this.firstCard.width;
    const h = this.firstCard.height;

    let x = this.foundationSection[0].pos.x;
    this.columnSection = [];

    for(let column=1;column<=7;column++) {
      let y = this.foundationSection[0].pos.y + h + GUTTER;
      const columnData = { stack: [], pos: { x, y }, ruleValue: 0, ruleSuites: '' };
      this.add.rectangle(x, y, w, h).setStrokeStyle(1, 0x3D3D3D);
      for(let c=1;c<=column;c++) {
        const card = this.drawSection[0].stack.pop();
        await card.moveTo(x, y, c == column)
        card.setLocation('column', column-1)
        columnData.stack.push(card);
        y += VSHIFT;
        //top card
        if(c == column && card.value > 1) {
          columnData.ruleValue = card.value - 1;
          columnData.ruleSuites = card.color == 'red' ? 'CS': 'DH';
        } //end if
      } //end inner for
      this.columnSection.push(columnData);
      x += w + GUTTER;
    } //end outer for
  }

  canMoveColumnCard(card) {
    if(!card.open) return false;
    const topKey = this.columnSection[card.column].stack.at(-1)?.key;
    return this.hasMatch(card, topKey == card.key);
  }

  canMovePlayCard(card) {
    const topKey = this.playSection[card.column].stack.at(-1)?.key;
    if(topKey != card.key) return false; //not top
    return this.hasMatch(card, true);
  }

  canMoveDrawCard() {
    return { targetSection: 'play', targetColumn: 0 }
  }

  canReset() {
    return { targetSection: 'draw', targetColumn: 0 }
  }

  hasMatch(card, isTopCard=true) {
    for(let fcIndex=0;isTopCard && fcIndex<4;fcIndex++) {
      if(this.foundationSection[fcIndex].ruleValue == card.value && 
          this.foundationSection[fcIndex].ruleSuites.includes(card.suite)) {
        return { targetSection: 'foundation', targetColumn: fcIndex };
      }
    }
    for(let colIndex=0;colIndex<7;colIndex++) {
      if(this.columnSection[colIndex].ruleValue == card.value && 
        this.columnSection[colIndex].ruleSuites.includes(card.suite)) {
        return { targetSection: isTopCard ? 'column': 'columnmultiple', targetColumn: colIndex };
      }
    }
    return false;
  }

  canMoveCard(card) {
    switch(card.section) {
    case "column":
      return this.canMoveColumnCard(card);
    case "draw":
      return this.canMoveDrawCard();
    case "play":
      return this.canMovePlayCard(card);
    case "reset":
      return this.canReset();
    }
  }

  setColumnRule(column) {
    const columnData = this.columnSection[column];
    if(columnData.stack.length) {
      const newCard = columnData.stack.at(-1);
      newCard.show(true);
      if(newCard.value > 1) {
        columnData.ruleValue = newCard.value - 1; 
        columnData.ruleSuites = newCard.color == 'red' ? 'CS': 'DH';
      }
      else {
        //it is an ace
        columnData.ruleValue = 0; 
        columnData.ruleSuites = '';
      }
    }
    else {
      columnData.ruleValue = 13; //king
      columnData.ruleSuites = 'CSHD';
    }
  }

  setFoundationRule(column) {
    const columnData = this.foundationSection[column];
    if(columnData.stack.length) {
      const newCard = columnData.stack.at(-1);
      columnData.ruleValue = newCard.value + 1;
      columnData.ruleSuites = newCard.suite;
    }
    else {
      columnData.ruleValue = 1;
      columnData.ruleSuites = 'CSHD';
    }
  }

  moveColumnToFoundation(card, targetColumn) {
    const sourceColumn = card.column;
    card.moveTo(this.foundationSection[targetColumn].pos.x, 
      this.foundationSection[targetColumn].pos.y, card.open);
    this.columnSection[sourceColumn].stack.pop();
    this.foundationSection[targetColumn].stack.push(card)
    this.setColumnRule(sourceColumn)
    this.setFoundationRule(targetColumn);
    card.setLocation('foundation', targetColumn);
    if(this.columnSection[sourceColumn].stack.length) {
      this.columnSection[sourceColumn].stack.at(-1).show(true);
    }
  }

  movePlayToFoundation(card, targetColumn) {
    const sourceColumn = card.column;
    card.moveTo(this.foundationSection[targetColumn].pos.x, 
      this.foundationSection[targetColumn].pos.y, card.open);
    this.playSection[sourceColumn].stack.pop();
    this.foundationSection[targetColumn].stack.push(card)
    this.setFoundationRule(targetColumn);
    card.setLocation('foundation', targetColumn);
    this.showLastThreePlayCards();
  }

  showLastThreePlayCards() {
    if(DRAW_COUNT != 3) return false;
    let { x, y } = this.playSection[0].pos;
    const playStack = this.playSection[0].stack;
    const lastCard = playStack.at(-1);
    lastCard.setPos(x, y, lastCard.open)
    if(playStack.length >= (DRAW_COUNT-1)) {
      //move prev card
      const prevCard = playStack.at(-2);
      x -= HSHIFT;
      prevCard.setPos(x,y, prevCard.open)
    }
  }

  moveColumnToColumnMultiple(card, targetColumn) {
    const sourceColumn = card.column;
    let { x, y } = this.columnSection[targetColumn].pos;
    y += this.columnSection[targetColumn].stack.length * VSHIFT;

    const sourceStack = this.columnSection[sourceColumn].stack;
    const cardIndex = sourceStack.findIndex(c=>c.key == card.key)
    const moveCardCount = sourceStack.length - cardIndex;
    for(let i=0;i<moveCardCount;i++) {
      const sourceCard = sourceStack[cardIndex+i]
      sourceCard.moveTo(x, y, sourceCard.open);
      this.columnSection[targetColumn].stack.push(sourceCard);
      sourceCard.setLocation('column', targetColumn)
      y += VSHIFT;
    }
    sourceStack.splice(cardIndex, moveCardCount);
    this.setColumnRule(sourceColumn)
    this.setColumnRule(targetColumn)
    if(sourceStack.length) {
      sourceStack.at(-1).show(true);
    }
  }

  moveColumnToColumn(card, targetColumn) {
    const sourceColumn = card.column;
    let { x, y } = this.columnSection[targetColumn].pos;
    y += this.columnSection[targetColumn].stack.length * VSHIFT;
    card.moveTo(x, y, card.open);
    this.columnSection[sourceColumn].stack.pop();
    this.columnSection[targetColumn].stack.push(card)
    this.setColumnRule(sourceColumn)
    this.setColumnRule(targetColumn)
    card.setLocation('column', targetColumn);
    if(this.columnSection[sourceColumn].stack.length) {
      this.columnSection[sourceColumn].stack.at(-1).show(true);
    }
  }

  async moveDrawToPlay(card, targetColumn) {
    let { x, y } = this.playSection[targetColumn].pos;
    x -= (DRAW_COUNT-1)*HSHIFT
    const sourceColumn = card.column;
    const targetStack = this.playSection[targetColumn].stack;
    if(DRAW_COUNT == 3) {
      //reset older card positions
      targetStack.forEach(c=>c.setPos(x, y, c.open));
    }

    for(let counter=0;counter < DRAW_COUNT; counter++) {
      const drawCard = this.drawSection[sourceColumn].stack.pop()
      if(drawCard) {
        await drawCard.moveTo(x, y, true)
        this.playSection[targetColumn].stack.push(drawCard);
        drawCard.setLocation('play', targetColumn)
      }
    }
    this.showLastThreePlayCards();
  }

  async movePlayToDraw() {
    let { x, y } = this.drawSection[0].pos;
    const count = this.playSection[0].stack.length;
    for(let i=0;i<count;i++) {
      const drawCard = this.playSection[0].stack.pop();
      await drawCard.moveTo(x, y, false)
      this.drawSection[0].stack.push(drawCard);
      drawCard.setLocation('draw', 0);
    }
  }

  movePlayToColumn(card, targetColumn) {
    const sourceColumn = card.column;
    let { x, y } = this.columnSection[targetColumn].pos;
    y += this.columnSection[targetColumn].stack.length * VSHIFT;
    card.moveTo(x, y, card.open);
    this.playSection[sourceColumn].stack.pop();
    this.columnSection[targetColumn].stack.push(card)
    this.setColumnRule(targetColumn)
    card.setLocation('column', targetColumn);
    this.showLastThreePlayCards();
  }

  moveToSection(card) {
    const {targetSection='none', targetColumn=0} = this.canMoveCard(card);
    const operation = `${card.section}2${targetSection}`; 
    switch(operation) {
    case "column2foundation":
      this.moveColumnToFoundation(card, targetColumn);
      break;
    case "column2column":
      this.moveColumnToColumn(card, targetColumn);
      break;
    case "column2columnmultiple":
        this.moveColumnToColumnMultiple(card, targetColumn);
        break;
    case "draw2play":
      this.moveDrawToPlay(card, targetColumn);
      break;
    case "play2foundation":
      this.movePlayToFoundation(card, targetColumn);
      break;
    case "play2column":
      this.movePlayToColumn(card, targetColumn);
      break;
    case "reset2draw":
      this.movePlayToDraw();
      break;
    }
  }

  doClick(gameObject) {
    const card = gameObject.getData('card');
    if(card) return this.moveToSection(card);
  }

  initEvents() {
    this.input.dragDistanceThreshold = 5;
    this.input.on('dragstart', (pointer, gameObject)=>{
      this.children.bringToTop(gameObject);
      gameObject.setData("isDragging", true)
    })

    this.input.on('drag', (pointer, gameObject, dragX, dragY)=>{
      gameObject.x = dragX;
      gameObject.y = dragY;
    })


    this.input.on('dragend', (pointer, gameObject, dropped) => {
      if (!dropped) {
        const card = gameObject.getData('card');
        card.moveTo(gameObject.input.dragStartX, gameObject.input.dragStartY, card.open)
      }
    });

    this.input.on('gameobjectup', (pointer, gameObject) => {
      const isDragging = gameObject.getData("isDragging")
      if(!isDragging) {
        this.doClick(gameObject);
      }
      gameObject.setData("isDragging", false)
    });

    this.input.on('gameobjectdown', (pointer, gameObject) => {
      gameObject.setData("isDragging", false)
    });
  }


  async create()
  {
    this.firstCard = new Card(this, 'AS'); //ace spade
  
    this.renderFoundationSection();
    this.renderDrawSection();
    await this.renderColumnSection();
    this.initEvents();
  }
}
