import Section, { GUTTER, VERT_OFFSET } from "./Section";

export default class ColumnSection extends Section {
  constructor(scene) {
    super(scene);
    this.name = "column";
    this.vertOffset = VERT_OFFSET;
    for(let i=0;i<7;i++) {
      this.data.push({ stack: [] });
      this.setRule(i);
    }
  }

  render(cardWidth, cardHeight, offsetX=0, offsetY=0) {
    let x = GUTTER+cardWidth/2+offsetX;
    let y = GUTTER+cardHeight/2+offsetY;

    for(let i=0;i<7;i++) {
      const columnData = this.data[i];
      columnData.pos = { x, y }
      this.scene.add.rectangle(x, y, cardWidth, cardHeight).setStrokeStyle(1, 0x3D3D3D);
      x += (cardWidth + GUTTER);
    }
    return this;
  }

  setRule(column) {
    const columnData = this.data[column];
    if(columnData.stack.length) {
      const card = columnData.stack.at(-1);
      if(card.value > 1) {
        columnData.ruleValue = card.value - 1; 
        columnData.ruleSuites = card.color == 'red' ? 'CS': 'DH';
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

  hasMatch(card, isTopCard=true) {
    for(let i=0;i<7;i++) {
      if(this.data[i].ruleValue == card.value && 
        this.data[i].ruleSuites.includes(card.suite)) {
        return { targetSection: this, targetColumn: i, multiple: !isTopCard };
      }
    }
    return false;
  }

  remove(column, pos=-1) {
    const card = super.remove(column, pos);
    const topCard = this.getTopCard(column);
    if(topCard) topCard.show(true);
    return card;
  }

  canMove(card, sections) {
    if(!card.open) return false;
    const topCard = this.getTopCard(card.column);
    let result = sections.foundation.hasMatch(card);
    if(!result)
      result = this.hasMatch(card, topCard.key == card.key)
    return result;
  }

  async moveMultiple(card, targetColumn) {
    const sourceColumn = card.column;
    const stack = this.data[sourceColumn].stack;
    const cardIndex = stack.findIndex(c=>c.key == card.key)
    const moveCardCount = stack.length - cardIndex;
    for(let i=0;i<moveCardCount;i++) {
      const sourceCard = this.remove(sourceColumn, cardIndex);
      await this.add(sourceCard, targetColumn, sourceCard.open);
    }
  }

  doClick(card, sections) {
    const { targetSection=null, targetColumn=0, multiple=false } = this.canMove(card, sections)
    if(targetSection) {
      if(multiple) {
        this.moveMultiple(card, targetColumn);
      }
      else {
        this.remove(card.column);
        targetSection.add(card, targetColumn, card.open);
      }
    }
  }

}
