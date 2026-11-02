import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeExpression } from '../src/lib/expressions.ts';
import { operateTree, values, balance, height, type TreeNode, type TreeMode } from '../src/lib/trees.ts';
test('expression precedence, unary operators, decimals, and implicit multiplication',()=>{
  for(const [input,expected] of [['(8 + 4) * 3 - 6 / 2',33],['-2^2',-4],['(-2)^2',4],['2^3^2',512],['2^-2',.25],['.5 + 1.25',1.75],['2(3+4)',14],['(2)(3)',6],['(2)3',6],['2*-3',-6],['--2',2],['- 2',-2],['5.',5]] as const){assert.equal(analyzeExpression(input,'infix').result,expected,input);}
});
test('prefix and postfix round trips preserve result and subtraction/division order',()=>{
  for(const input of ['(2+3)*4','8-3/2','-2^2','2^-3','-(2+3)','2^3^2','1.5 + .5']){
    const a=analyzeExpression(input,'infix');
    assert.equal(analyzeExpression(a.prefix,'prefix').result,a.result);
    assert.equal(analyzeExpression(a.postfix,'postfix').result,a.result);
    assert.equal(analyzeExpression(a.infix,'infix').result,a.result);
    assert.equal(a.steps.at(-1)!.stack.length,1);
  }
  assert.equal(analyzeExpression('/ 12 3','prefix').result,4);
  assert.equal(analyzeExpression('12 3 /','postfix').result,4);
});
test('invalid expressions are rejected instead of silently normalized',()=>{
  for(const s of ['','1 2','2x+3','2..3','(2+3','2+3)','1+','()','1/0','(-1)^.5','10^1000'])assert.throws(()=>analyzeExpression(s,'infix'),s);
  for(const n of ['prefix','postfix'] as const)for(const s of ['1 2','+','~','2 x +'])assert.throws(()=>analyzeExpression(s,n));
});
function verify(n:TreeNode|null,avl:boolean,low=-Infinity,high=Infinity):number{
  if(!n)return 0;
  assert.ok(n.value>low&&n.value<high,`ordering at ${n.value}`);
  const h=1+Math.max(verify(n.left,avl,low,n.value),verify(n.right,avl,n.value,high));
  assert.equal(n.height,h);
  if(avl)assert.ok(Math.abs(balance(n))<=1,`balance at ${n.value}`);
  return h;
}
test('all AVL insertion rotation cases',()=>{
  for(const input of ['30,20,10','10,20,30','30,10,20','10,30,20']){
    const steps=operateTree(null,input,'insert','avl'),root=steps.at(-1)!.root;
    assert.equal(root!.value,20);assert.deepEqual(values(root),[10,20,30]);verify(root,true);
    assert.ok(steps.some(s=>/rotation/i.test(s.message)));
  }
});
test('BST and AVL deletion, batch atomicity, duplicate and missing values',()=>{
  for(const mode of ['bst','avl'] as TreeMode[]){
    let root=operateTree(null,'40,20,60,10,30,50,70,25','insert',mode).at(-1)!.root;
    const snapshot=JSON.stringify(root);
    assert.throws(()=>operateTree(root,'99, invalid','insert',mode));assert.equal(JSON.stringify(root),snapshot);
    root=operateTree(root,'20,20','insert',mode).at(-1)!.root;assert.equal(values(root).length,8);
    for(const value of [10,30,40,99,20,25,50,60,70]){root=operateTree(root,String(value),'delete',mode).at(-1)!.root;verify(root,mode==='avl');assert.ok(!values(root).includes(value));}
    assert.equal(root,null);
  }
});
test('deterministic randomized operations maintain ordering, heights and AVL balance',()=>{
  let seed=7281;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed;};
  for(const mode of ['bst','avl'] as TreeMode[]){
    let root:TreeNode|null=null;const expected=new Set<number>();
    for(let i=0;i<400;i++){
      const value=random()%55,operation=random()%3===0?'delete':'insert';
      if(operation==='insert')expected.add(value);else expected.delete(value);
      const before: string=JSON.stringify(root);
      const trace=operateTree(root,String(value),operation,mode);
      assert.equal(JSON.stringify(root),before,'input tree must not be mutated');
      root=trace.at(-1)!.root;verify(root,mode==='avl');assert.deepEqual(values(root),[...expected].sort((a,b)=>a-b));
    }
    assert.ok(height(root)>0);
  }
});
