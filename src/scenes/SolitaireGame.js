
import { Scene, Math } from 'phaser';
import cardImages from './assets/*.svg';
import Card from './Card';

const GUTTER = 20;
const VSHIFT = 20;
const HSHIFT = 30;
const DRAW_COUNT = 1;

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

    this.add.rectangle(x, y, w, h).setStrokeStyle(1, 0x3D3D3D).setInteractive();

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
    const topKey = this.columnSection[card.column].stack.at(-1)?.key;
    if(topKey != card.key) return false; //not top
    return this.hasMatch(card);
  }

  canMovePlayCard(card) {
    const topKey = this.playSection[card.column].stack.at(-1)?.key;
    if(topKey != card.key) return false; //not top
    return this.hasMatch(card);
  }

  canMoveDrawCard(card) {
    return { targetSection: 'play', targetColumn: 0 }
  }

  hasMatch(card) {
    for(let fcIndex=0;fcIndex<4;fcIndex++) {
      if(this.foundationSection[fcIndex].ruleValue == card.value && 
          this.foundationSection[fcIndex].ruleSuites.includes(card.suite)) {
        return { targetSection: 'foundation', targetColumn: fcIndex };
      }
    }
    for(let colIndex=0;colIndex<7;colIndex++) {
      if(this.columnSection[colIndex].ruleValue == card.value && 
        this.columnSection[colIndex].ruleSuites.includes(card.suite)) {
        return { targetSection: 'column', targetColumn: colIndex };
      }
    }
    return false;
  }

  canMoveCard(card) {
    switch(card.section) {
    case "column":
      return this.canMoveColumnCard(card);
    case "draw":
      return this.canMoveDrawCard(card);
    case "play":
      return this.canMovePlayCard(card);
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
    for(let counter=0;counter < DRAW_COUNT; counter++) {
      const drawCard = this.drawSection[sourceColumn].stack.pop()
      if(drawCard) {
        await drawCard.moveTo(x, y, true)
        this.playSection[targetColumn].stack.push(drawCard);
        drawCard.setLocation('play', targetColumn)
        x += HSHIFT;
      }
    }
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
    case "draw2play":
      this.moveDrawToPlay(card, targetColumn);
      break;
    case "play2foundation":
      this.movePlayToFoundation(card, targetColumn);
      break;
    case "play2column":
      this.movePlayToColumn(card, targetColumn);
      break;
    }
  }

  doClick(gameObject) {
    if(gameObject.type == 'Image') {
      const card = gameObject.getData('card');
      this.moveToSection(card);
    }
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
