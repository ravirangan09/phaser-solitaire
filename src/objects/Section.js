export const GUTTER = 20;
export const VERT_OFFSET = 20;
export const HSHIFT = 30;

export default class Section {
  constructor(scene) {
    this.data = [];
    this.scene = scene;
    this.vertOffset = 0;
  }

  async add(card, column, open, isInit=false) {
    let { x, y } = this.data[column].pos;
    y += this.data[column].stack.length * this.vertOffset;
    if(isInit) {
      card.setPosition(x, y, open)
    }
    else {
      await card.moveTo(x, y, open);
    }
    card.setLocation(this, column);
    this.data[column].stack.push(card);
    this.setRule(column);
    this.modifyDropZone(column);
  }

  remove(column, pos=-1) {
    if(!this.data[column].stack.length) return false;
    const [card] = this.data[column].stack.splice(pos, 1);
    this.setRule(column);
    this.modifyDropZone(column);
    return card;
  }

  setRule(column) {
    this.data[column].ruleValue = 0;
    this.data[column].ruleSuites = '';
  }

  hasMatch() {
    return false;
  }

  canMove() {
    return false;
  }

  modifyDropZone() {
    return false;
  }

  canDrag(card) {
    return this.isTopCard(card);
  }

  canDrop(card, zone) {
    const [targetSection, targetColumn]  = zone.getData(['section', 'column']);
    return targetSection.hasMatchColumn(card, targetColumn);
  }

  getPosition(column) {
    return this.data[column].pos;
  }

  getTopCard(column) {
    return this.data[column].stack.at(-1);
  }

  isTopCard(card) {
    const topCard = this.getTopCard(card.column);
    return topCard.key == card.key;
  }

  hasMatchColumn(card, column) {
    return this.data[column].ruleValue == card.value && 
      this.data[column].ruleSuites.includes(card.suite);
  }

  async doClick(card, sections) {
    const { targetSection=null, targetColumn=0, multiple=false } = this.canMove(card, sections)
    if(targetSection) {
      if(multiple) {
        await this.moveMultiple(card, targetColumn);
      }
      else {
        const sourceColumn = card.column;
         this.remove(sourceColumn);
        await targetSection.add(card, targetColumn, card.open);
        this.add2UndoMove({ sourceSection: this, 
                            sourceColumn, 
                            targetSection, 
                            targetColumn, 
                            key: card.key, 
                            sourceOpen: true, 
                            targetOpen: true 
                          });
      }
    }
  }

  getCard(column, key) {
    const cardIndex = this.data[column].stack.findIndex(c=>c.key == key);
    const card = this.data[column].stack[cardIndex];
    return { card, cardIndex };
  }

  add2UndoMove(data) {
    this.scene.events.emit("undomove", { action: 'move', data });
  }

  add2UndoClose(card) {
    this.scene.events.emit("undomove", { action: 'close', 
                                          data: { targetSection: card.section, 
                                                  targetColumn: card.column, 
                                                  key: card.key 
                                                } 
                                        }
                          );
  }

}
