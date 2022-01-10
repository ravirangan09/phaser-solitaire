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
      columnData.zone = this.scene.add.zone(x, y, cardWidth, cardHeight)
                                .setRectangleDropZone(cardWidth, cardHeight)
                                .setData({ section: this, column: i })

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

  modifyDropZone(column) {
    const dataColumn = this.data[column];
    const count = dataColumn.stack.length;
    let { x, y } = dataColumn.pos;
    y += count > 1 ? (count-1)*VERT_OFFSET: 0;
    dataColumn.zone.setPosition(x, y);
  }

  hasMatch(card, isTopCard=true) {
    for(let i=0;i<7;i++) {
      if(this.hasMatchColumn(card, i)) {
        return { targetSection: this, targetColumn: i, multiple: !isTopCard };
      }
    }
    return false;
  }


  canMove(card, sections) {
    if(!card.open) return false;
    const topCard = this.getTopCard(card.column);
    const isTop = topCard.key == card.key;
    let result=false;
    if(isTop) {
      result = sections.foundation.hasMatch(card);
    }
    if(!result) {
      result = this.hasMatch(card, isTop);
    }
    return result;
  }

  async moveMultiple(card, targetColumn) {
    const sourceColumn = card.column;
    const stack = this.data[sourceColumn].stack;
    const cardIndex = stack.findIndex(c=>c.key == card.key)
    const moveCardCount = stack.length - cardIndex;
    const moveData = [];
    for(let i=0;i<moveCardCount;i++) {
      const sourceCard = this.remove(sourceColumn, cardIndex);
      await this.add(sourceCard, targetColumn, sourceCard.open);
      moveData.unshift({ sourceSection: this, 
                          sourceColumn, 
                          targetSection: this, 
                          targetColumn, 
                          sourceOpen: true,  
                          targetOpen: true, 
                          key: sourceCard.key 
                        })
    }
    moveData.forEach(m=>this.add2UndoMove(m));  //switch order
  }

  async doClick(card, sections) {
    const sourceColumn = card.column;
    await super.doClick(card, sections);
    const topCard = this.getTopCard(sourceColumn);
    if(topCard && !topCard.open) {
      topCard.show(true);
      this.add2UndoClose(topCard)
    }
  }

}
