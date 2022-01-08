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
  }

  remove(column, pos=-1) {
    if(!this.data[column].stack.length) return false;
    const [card] = this.data[column].stack.splice(pos, 1);
    this.setRule(column);
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

  getPosition(column) {
    return this.data[column].pos;
  }

  getTopCard(column) {
    return this.data[column].stack.at(-1);
  }

}
