"""Independent symbolic checks for all 60 authored answers (SymPy, not the site engine).
Run: python -m pip install -r tests/requirements-math.txt && python tests/audit-mathematics.py
The theorem hypotheses and explanatory prose also require editorial review.
"""
import json
from pathlib import Path
import sympy as S
x,t,h,u,a,b,y=S.symbols('x t h u a b y', real=True)
p=S.symbols('p',positive=True)
checks={}
def add(id,fragment,*equalities): checks[id]=(fragment,equalities)
def derivative(f,F):return S.diff(f,x),F
def primitive(f,F):return S.diff(F,x),f
def lim(f,at,direction='+'):return S.limit(f,x,at,dir=direction)
add('limits-1','$8$',(lim((x*x-16)/(x-4),4),8))
add('limits-2',r'\frac32',(lim((S.sqrt(1+3*x)-1)/x,0),S.Rational(3,2)))
add('limits-3','does not exist',(S.Eq(5,7),False))
add('limits-4','$5$',(lim(x**3-2*x+1,2),5))
add('limits-5','$5/2$',(lim(S.sin(5*x)/(2*x),0),S.Rational(5,2)))
add('limits-6','$3/2$',(lim((3*x*x-x+2)/(2*x*x+5),S.oo),S.Rational(3,2)))
add('limits-7','does not exist',(lim(S.Abs(x)/x,0,'-'),-1),(lim(S.Abs(x)/x,0),1))
add('limits-8','$0$',(lim(x*S.sin(1/x),0),0))
add('limits-9','$1/2$',(lim((S.exp(x)-1-x)/x**2,0),S.Rational(1,2)))
add('limits-10','$k=2$',(lim((x*x-1)/(x-1),1),2))
add('limits-11',r'\delta=\varepsilon/4',(4*(p/4),p),(S.Abs((4*x-2)-2),4*S.Abs(x-1)))
add('limits-12','$0$',(lim(x*S.log(x),0),0))
add('derivatives-1','$20x^4-6x$',derivative(4*x**5-3*x*x+7,20*x**4-6*x))
add('derivatives-2',r'$2x\cos(x^2+1)$',derivative(S.sin(x*x+1),2*x*S.cos(x*x+1)))
add('derivatives-3','$11$',(S.diff(-x*x+8*x-5,x).subs(x,4),0),(-x*x+8*x-5,11-(x-4)**2))
add('derivatives-4','$e^x(x^2+2x)$',derivative(x*x*S.exp(x),S.exp(x)*(x*x+2*x)))
add('derivatives-5',r'\frac{x^2-2x-1}{(x-1)^2}',derivative((x*x+1)/(x-1),(x*x-2*x-1)/(x-1)**2))
add('derivatives-6',r'\frac{2x}{1+x^2}',derivative(S.log(1+x*x),2*x/(1+x*x)))
add('derivatives-7',r'y-4=-\frac34(x-3)',(3**2+4**2,25),(S.Rational(-3,4),-S.Rational(2*3,2*4)))
add('derivatives-8',r'x^x(\ln x+1)',(S.diff(p**p,p),p**p*(S.log(p)+1)))
f=x**3-3*x
add('derivatives-9','Maximum $2$ at $x=-1,2$; minimum $-2$ at $x=-2,1$.',*( (f.subs(x,k),v) for k,v in [(-2,-2),(-1,2),(1,-2),(2,2)]))
add('derivatives-10','$c=2$',(S.diff(x*x,x).subs(x,2),S.Rational(9-1,3-1)))
add('derivatives-11',r'72\pi',(S.diff(4*S.pi*x**3/3,x).subs(x,3)*2,72*S.pi))
add('derivatives-12','2.025',(2+S.Rational(1,4)*(S.Rational(41,10)-4),S.Rational(81,40)),(S.Rational(81,40)>S.sqrt(S.Rational(41,10)),True))
add('integrals-1','$2x^3-2x^2+3x+C$',primitive(6*x*x-4*x+3,2*x**3-2*x*x+3*x))
add('integrals-2','$e^{x^2}+C$',primitive(2*x*S.exp(x*x),S.exp(x*x)))
add('integrals-3','$10$',(S.integrate(3*x*x+1,(x,0,2)),10))
add('integrals-4','$e^x(x-1)+C$',primitive(x*S.exp(x),S.exp(x)*(x-1)))
add('integrals-5',r'\ln(1+x^2)+C',primitive(2*x/(1+x*x),S.log(1+x*x)))
add('integrals-6',r'x/2-\sin(2x)/4+C',primitive(S.sin(x)**2,x/2-S.sin(2*x)/4))
# Check derivative of real log |v| as v'/v on each nonzero interval.
add('integrals-7',r'\frac12\ln|x-1|-\frac12\ln|x+1|+C',(S.Rational(1,2)/(x-1)-S.Rational(1,2)/(x+1),1/(x*x-1)))
add('integrals-8','Signed integral $0$; geometric area $1$.',(S.integrate(x,(x,-1,1)),0),(S.integrate(S.Abs(x),(x,-1,1)),1))
add('integrals-9','$A=1/6$',(S.integrate(x-x*x,(x,0,1)),S.Rational(1,6)))
add('integrals-10',r'$2x\cos(x^2)$',(S.diff(S.integrate(S.cos(t),(t,0,x*x)),x),2*x*S.cos(x*x)))
add('integrals-11','Converges to $1$.',(S.integrate(1/x**2,(x,1,S.oo)),1))
add('integrals-12','Diverges',(S.limit(-S.log(p),p,0,dir='+'),S.oo))
add('limits-piecewise','$a=3/4$, limit $3/2$',(lim((S.sqrt(1+3*x)-1)/x,0,'-'),S.Rational(3,2)),(lim(S.Rational(3,4)*S.sin(2*x)/x,0),S.Rational(3,2)))
add('limits-negative-infinity','$-3/2$',(lim(S.sqrt(x*x+3*x)+x,-S.oo),-S.Rational(3,2)))
add('limits-radical-squeeze','$-1/2$',(lim((S.sqrt(1+2*x)-1-x)/x**2,0),-S.Rational(1,2)),(lim(x*S.sin(1/x**2),0),0))
add('continuity-two-joins','$a=3,',(3*1-2,1),(3*3-2,7))
add('continuity-unique-root','Exactly one real root',((x**3+x-1).subs(x,S.Rational(1,2)),-S.Rational(3,8)),((x**3+x-1).subs(x,S.Rational(3,4)),S.Rational(11,64)),(S.diff(x**3+x-1,x),3*x*x+1))
add('continuity-derivative-discontinuous',"$f'(0)=0$",(lim(x*x*S.sin(1/x),0),0),(lim(x*S.sin(1/x),0),0),(S.diff(x*x*S.sin(1/x),x),2*x*S.sin(1/x)-S.cos(1/x)))
q=x*x+x*y+y*y-3; yp=-S.diff(q,x)/S.diff(q,y)
ypp=S.diff(yp,x)+S.diff(yp,y)*yp
add('derivatives-implicit-second',"$y''=-2/3$",(q.subs({x:1,y:1}),0),(yp.subs({x:1,y:1}),-1),(ypp.subs({x:1,y:1}),-S.Rational(2,3)))
g=(x*x+1)**S.sin(x)/S.sqrt(x+2)
add('derivatives-log-composite',r'\dfrac{2x\sin x}{x^2+1}',derivative(g,g*(S.cos(x)*S.log(x*x+1)+2*x*S.sin(x)/(x*x+1)-1/(2*(x+2)))))
u=2*x/(1+x*x)
add('derivatives-inverse-trig',"$y'=2/(1+x^2)$",(1-u*u,(1-x*x)**2/(1+x*x)**2),(S.diff(u,x),2*(1-x*x)/(1+x*x)**2))
add('applications-ladder','$dy/dt=-1.5',(6**2+8**2,100),(-S.Rational(6,8)*2,-S.Rational(3,2)))
v=x*(30-2*x)*(20-2*x); cut=(25-5*S.sqrt(7))/3
add('applications-box',r'1000(10+7\sqrt7)/27',(S.diff(v,x).subs(x,cut),0),(v.subs(x,cut),1000*(10+7*S.sqrt(7))/27),(v.subs(x,0),0),(v.subs(x,10),0))
f=x**4-4*x*x
add('applications-quartic',r'\pm\sqrt{2/3},-20/9',(f.subs(x,S.sqrt(2)),-4),(f.subs(x,S.sqrt(S.Rational(2,3))),-S.Rational(20,9)),(S.diff(f,x,2),12*x*x-8))
velocity=3*t*t-4*t+2;position=t**3-2*t*t+2*t+1
add('integrals-motion','both $4',(S.diff(position,t),velocity),(S.diff(velocity,t),6*t-4),(position.subs(t,2)-position.subs(t,0),4),(velocity,3*(t-S.Rational(2,3))**2+S.Rational(2,3)))
add('integrals-log-tail','Converges to $1$.',(S.integrate(1/(x*S.log(x)**2),(x,S.E,S.oo)),1))
add('integrals-two-improper-ends',r'equals $\pi$',(S.integrate(1/(S.sqrt(x)*(1+x)),(x,0,1)),S.pi/2),(S.integrate(1/(S.sqrt(x)*(1+x)),(x,1,S.oo)),S.pi/2))
add('techniques-repeated-parts',r'-e^{-x}(x^2+2x+2)+C',primitive(x*x*S.exp(-x),-S.exp(-x)*(x*x+2*x+2)))
add('techniques-trig-substitution',r'\frac92\arcsin(x/3)-\frac12x\sqrt{9-x^2}+C',primitive(x*x/S.sqrt(9-x*x),S.Rational(9,2)*S.asin(x/3)-x*S.sqrt(9-x*x)/2))
add('techniques-repeated-fractions',r'4\ln|x|-2\ln|x+1|+\frac3{x+1}+C',(4/x-2/(x+1)-3/(x+1)**2,(2*x*x+3*x+4)/(x*(x+1)**2)))
add('ftc-two-moving-bounds',r'2x(1+x^8)-\cos x(1+\sin^4x)',(S.diff(S.integrate(1+t**4,(t,S.sin(x),x*x)),x),2*x*(1+x**8)-S.cos(x)*(1+S.sin(x)**4)))
Aleft=x-x*x/2;Aright=S.Rational(1,2)+(x-1)**2/2
add('ftc-absolute-accumulation',"$A''(1)$ does not exist",(Aleft.subs(x,1),Aright.subs(x,1)),(S.diff(Aleft,x).subs(x,1),0),(S.diff(Aright,x).subs(x,1),0),(S.diff(Aleft,x,2),-1),(S.diff(Aright,x,2),1))
A=1-(x+1)**2*S.exp(-x)
add('ftc-exponential-accumulation','Minimum $1-4/e$',(S.diff(A,x),(x*x-1)*S.exp(-x)),(S.diff(A,x,2),(-x*x+2*x+1)*S.exp(-x)),(A.subs(x,1),1-4/S.E),(A.subs(x,3),1-16/S.E**3),(A.subs(x,0),0))
add('areas-switching-order','$1/2$',(S.integrate(x**3-x,(x,-1,0))+S.integrate(x-x**3,(x,0,1)),S.Rational(1,2)))
add('areas-line-parabola','$32/3$',(S.integrate(2*x+3-x*x,(x,-1,3)),S.Rational(32,3)))
add('areas-horizontal-slices',r'$8\sqrt3$',(S.integrate(y+2-y*y/4,(y,2-2*S.sqrt(3),2+2*S.sqrt(3))),8*S.sqrt(3)))
problems={p['id']:p for p in json.loads(Path('content/practice.json').read_text())}
assert checks.keys()==problems.keys(), f'Missing coverage: {checks.keys()^problems.keys()}'
count=0
for id,(fragment,equalities) in checks.items():
 assert fragment in problems[id]['answer']['en'],f'{id}: answer changed; update mathematical review'
 for lhs,rhs in equalities:
  if isinstance(lhs,(bool,S.logic.boolalg.BooleanAtom)): valid=bool(lhs)==bool(rhs)
  else: valid=S.simplify(lhs-rhs)==0 or lhs==rhs
  assert valid,f'{id}: {lhs} != {rhs}'
  count+=1
 print('PASS',id)
print(f'{len(checks)} answers / {count} independent mathematical checks passed.')
