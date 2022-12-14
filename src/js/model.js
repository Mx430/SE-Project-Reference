class GObj
{
  constructor(base)
  {
    if (!GObj.__dict__) { GObj.__dict__ = {} };
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;

    if (base)
    {
      this.base    = base;
      this.attrs   = Object.keys(base.attrs  ).map(k => base.attrs  [k]);
      this.methods = Object.keys(base.methods).map(k => base.methods[k]);
      this.init(base);
      GObj.__dict__[base.name] = this;
    } else {
      this.attrs   = [];
      this.methods = [];
    }

  }
  //---- Adaptor Pattern
  get interfaces()  { return this.base.interfaces; }
  get IsInterfaces() { return this.interfaces == null; }
  get name()  { 
    if (this.IsInterfaces) return ["<< Interface >>", this.base.name];
    return [this.base.name];
  }  
  get parent() {
    if (!this.base.parent) return null;
    return GObj.__dict__[this.base.parent.name]
        || new GObj(this.base.parent);
  }
  get interfaces() {
    if (!this._intf)
    {
      if (!this.base.interfaces) return null;
      this._intf = this.base.interfaces.map(i =>
        GObj.__dict__[i.name] || new GObj(i)
      );
    }
    return this._intf;
  }
  //--

  init(base)
  {
    // Set box height
    // this.h =      10 * (this.name.length + (this.name.length - 1))
    //        + 20 + 10 * (this.attrs.length + (this.attrs.length - 1))
    //        + 20 + 10 * (this.methods.length + (this.methods.length - 1))
    //        + 20;
    this.h = 30 + 20 * (this.name.length + this.attrs.length + this.methods.length);

    // Set box width
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    context.font = '12px san-serif';

    let maxWordLength = -1;

    this.attrs.forEach(s => {
      let rect = context.measureText(s.toString());
      maxWordLength = Math.max(maxWordLength, rect.width);
    });
    this.methods.forEach(s => {
      let rect = context.measureText(s);
      maxWordLength = Math.max(maxWordLength, rect.width);
    });
    this.name.forEach(s => {
      let rect = context.measureText(s);
      maxWordLength = Math.max(maxWordLength, rect.width);
    });

    this.w = maxWordLength + 2*C.BOX_PADX;
  }
  get X() { return this.x - this.w/2; }
  get Y() { return this.y - this.h/2; }

  get ClassNameSeparatorY() {
    return this.Y 
         + this.name.length * C.ClassNameHeight
         + C.ClassNameHeight / 2;
  }
  get AttributesSeparatorY() {
    return this.ClassNameSeparatorY
         + this.attrs.length * C.AttributeLineHeight
         + C.AttributeLineHeight / 2;
  }



  get ParentDrawPath()
  {
    let p = this.getArrowPoints(this.parent);
    return `
    M${p.o}
    L${p.m}
    L${p.l}
    L${p.p}
    L${p.r}
    L${p.m}`.replace(/\s+/g, '');
  }
  InterfaceDrawPathTail(i)
  {
    let p = this.getArrowPoints(i);
    return `M${p.o}L${p.m}`;
  }
  InterfaceDrawPathArrow(i)
  {
    let p = this.getArrowPoints(i);
    return `M${p.l}L${p.r}L${p.p}Z`;
  }

  getArrowPoints(p)
  {
    const R = 10;                   // arrow size
    const deg30 = Math.PI / 6;      // half triangle theta
    const ml = R * Math.cos(deg30); // triangle height

    // points of arrow head and tail
    let vf, vt;

    // direction of the 2 boxes
    let alpha = Math.atan2(
      (this.y - p.y) / this.h,
      (this.x - p.x) / this.w
    );
    let beta = Math.atan2(
      (p.y - this.y) / p.h,
      (p.x - this.x) / p.w
    );


    // ---- select point, by face
    // from
    let face1 = Math.round(2*alpha / Math.PI + 4) % 4;
    switch (face1) {
      case 0:
        vf = new Vec2D(this.x - this.w/2, this.y); break;
      case 1:
        vf = new Vec2D(this.x, this.y - this.h/2); break;
      case 2:
        vf = new Vec2D(this.x + this.w/2, this.y); break;
      case 3:
        vf = new Vec2D(this.x, this.y + this.h/2); break;
    }

    // to
    let face2 = Math.round(2*beta / Math.PI + 4) % 4;
    switch (face2) {
      case 0:
        vt = new Vec2D(p.x - p.w/2, p.y); break;
      case 1:
        vt = new Vec2D(p.x, p.y - p.h/2); break;
      case 2:
        vt = new Vec2D(p.x + p.w/2, p.y); break;
      case 3:
        vt = new Vec2D(p.x, p.y + p.h/2); break;
    }

    // ---- end selection

    let o = {
      o: vf,
      p: vt,
      l: vt.clone(), // left point of triangle
      r: vt.clone(), // right point of triangle
      m: vt.clone(), // mid-point of triangle
    };

    let theta = o.o.sub(o.p).atan2();

    o.l = o.l.add( Vec2D.rotate(R,  theta + deg30) );
    o.r = o.r.add( Vec2D.rotate(R,  theta - deg30) );
    o.m = o.m.add( Vec2D.rotate(ml, theta) );

    return o;
  }

}
class Vec2D
{
  constructor(x, y) {
    this.x = x||0;
    this.y = y||0;
  }
  static rotate(length, theta) {
    return new Vec2D(
      Math.cos(theta) * length,
      Math.sin(theta) * length
    );
  }
  clone() {
    return new Vec2D(this.x, this.y);
  }
  neg() {
    return new Vec2D(-this.x, -this.y);
  }
  add(v, y) {
    let p = this.clone();
    if (v instanceof Vec2D) {
      p.x += v.x;
      p.y += v.y;
    } else if (v instanceof Number) {
      p.x += v;
      p.y += y||0;
    }
    return p;
  }
  sub(v, y) {
    if (v instanceof Vec2D) {
      return this.add(v.neg());
    } else if (v instanceof Number) {
      return this.add(-v, -y);
    }
    return this.clone();
  }
  atan2() {
    return Math.atan2(this.y, this.x);
  }
  toString() {
    return `${this.x},${this.y}`;
  }
  
}

class UML_Object
{
  constructor() {
	
    this.name = "";
    this.attrs   = {};
    this.methods = {};
    this.assocs  = {};
    this.parent  = null;
  }
  addAttribute(attr) {
    if (this.attrs["$" + attr.name]) {
      // TODO: change all error messages into standardised object,
      //       which provides information for the text parser, and display
      //       error messages to the users.
      throw 'Attribute name already declared';
    }
    this.attrs["$" + attr.name] = attr;
  }
  addMethod(method) {
    if (this.methods["$" + method.name]) {
      throw 'Method already declared';
    }
    this.methods["$" + method.name] = method;
  }
  connect(obj, action_name) {
    this.assocs[obj.name] = action_name;
  }
  extends(obj) {
    throw 'NotImplementedException: must be implemented by the subclass';
  }
}

// -------------------------------------
class UML_Class extends UML_Object
{
  constructor() {
    super();
    this.interfaces = [];
  }
  extends(obj) {
    if (!(obj instanceof UML_Class)) {
      throw 'Class must extends another class only';
    }
    this.parent = obj;
  }
  implements(obj) {
    if (!(obj instanceof UML_Interface)) {
      throw 'Only interfaces can be implemented';
    }
    // TODO: search whether the interface is already implemented
    this.interfaces.push(obj);
  }
}

// -------------------------------------
class UML_Interface extends UML_Object
{
  constructor() {
    super();
  }
  extends(obj) {
    if (!(obj instanceof UML_Interface)) {
      'An interface can only inherits another interface';
    }
    this.parent = obj;
  }
}

// -------------------------------------
class UML_Attribute
{
  constructor(modifier, name, type)
  {
    this.modifier = modifier;
    this.name = name;
    this.type = type;
  }
  toString()
  {
    return `${this.modifier} ${this.name}:${this.type}`;
  }
}

// -------------------------------------
class UML_Method
{
  constructor(modifier, name, type)
  {
    this.modifier = modifier;
    this.name = name;
    this.parameters = [];
    this.type = type; // return type
  }

  addParam(type, name)
  {
    this.parameters.push({type: type, name: name});
  }

  toString()
  {
    let param = this.parameters.map(
      x => `${x.type} ${x.name}`
    ).join(', ');
    return `${this.modifier} ${this.name}(${param}):${this.type}`;
  }
}
