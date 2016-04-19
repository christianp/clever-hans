from parsimonious.grammar import Grammar
from parsimonious.nodes import NodeVisitor,rule
import math

from parsimonious.grammar import Grammar

grammar = Grammar("""
        Expression
         = ("clever hans "/"") question 
         
        question
         = question_what / question_love
         
        question_what = ("what is"/"what's"/"can you tell me"/"") " "? terms
        question_love = "i love you" space "hans"?

        terms
         = atom next_term*
         
        next_term = space op space

        op
         =  op_all_squared / op_binary 

        op_all_squared = ("all "? "squared")
        op_binary = (binaryop " "? atom)

        atom
         =  atom_unary
         /  atom_root
         /  atom_function
         /  number

        atom_unary = number space ("squared"/"cubed"/"factorial")
        atom_root = ("the square root of"/"root"/"route"/"√") " "? number
        atom_function = (gcd/lcm) space terms space "and" space terms

        binaryop
            = add 
            / multiply 
            / subtract
            / divide
            / power
         
        add = ("+"/"add"/"plus") 
        multiply = ("×"/"x"/"times"/"multiplied by") 
        subtract = ("-"/"minus"/"take away"/"takeaway"/"take-away") 
        divide = ("÷"/"divided by"/"over") 
        power = ("^"/"to the power of"/"to the") 

        gcd = "the greatest common factor of"/"the greatest common divisor of"/"the gcd of"/"the gcf of"/"the biggest number that divides"
        lcm = "the least common multiple of"/"the lcm of"/"the smallest multiple of both"

        space = (" "*)

        number
         = digit / number_word
         
        number_word
         = "one" 
         / ("two"/"to"/"too") 
         / "three" 
         / ("four"/"for") 
         / "five" 
         / "six" 
         / "seven" 
         / ("eight"/"ate") 
         / "nine" 
         / "zero" 
         
        digit = ~r"[0-9]+"

""")
ops = {
    '+': lambda a,b:a+b,
    '-': lambda a,b:a-b,
    '*': lambda a,b:a*b,
    '/': lambda a,b:a/b,
    '^': lambda a,b:a**b,
    'squared': lambda a:a*a,
}

unary_ops = {
    'squared': lambda a:a*a,
    'cubed': lambda a:a*a*a,
    'factorial': math.factorial,
}

def gcd(a,b):
    a,b = int(a),int(b)
    if a<1 or b<1:
        raise Exception("gcd of non-positive numbers")
    if a<b:
        return gcd(b,a)
    while b!=0:
        a,b = b,a%b
    return a

def lcm(a,b):
    return a*b//gcd(a,b)

function_ops = {
    'gcd': gcd,
    'lcm': lcm
}

class HansVisitor(NodeVisitor):
    grammar = grammar
    
    def visit_space(self,*args):
        pass
    
    def visit_digit(self,node,visited_children):
        return int(node.text)
    
    def visit_number_word(self,node,visited_children):
        d = {
            'one': 1,
            'two': 2, 'to': 2, 'too': 2,
            'three': 3,
            'four': 4, 'for': 4,
            'five': 5,
            'six': 6,
            'seven': 7,
            'eight': 8, 'ate': 8,
            'nine': 9,
            'zero': 0
        }
        return d[node.text]
    
    def visit_number(self,node,visited_children):
        return visited_children[0]
    
    def visit_add(self,*args):
        return '+'

    def visit_multiply(self,*args):
        return '*'
    
    def visit_subtract(self,*args):
        return '-'
    
    def visit_divide(self,*args):
        return '/'
    
    def visit_power(self,*args):
        return '^'
    
    def visit_binaryop(self,node,visited_children):
        return visited_children[0]
    
    def visit_atom(self,node,visited_children):
        return visited_children[0]
    
    def visit_op_binary(self,node,visited_children):
        opname,_,arg = visited_children
        return (opname,arg)

    def visit_op_all_squared(self,node,visited_children):
        return ('squared',None)

    def visit_atom_unary(self,node,visited_children):
        n,_,op = visited_children
        return unary_ops[op](n)

    def visit_atom_root(self,node,visited_children):
        n = visited_children[2]
        return math.sqrt(n)

    def visit_gcd(self,node,visited_children):
        return 'gcd'
    def visit_lcm(self,node,visited_children):
        return 'lcm'

    def visit_atom_function(self,node,visited_children):
        op,_,a,_,_,_,b = visited_children
        return function_ops[op](a,b)
    
    def visit_op(self,node,visited_children):
        return visited_children[0]
    
    def visit_terms(self,node,visited_children):
        n = visited_children[0]
        for op,b in visited_children[1]:
            if b is None:
                n = ops[op](n)
            else:
                n = ops[op](n,b)
        return n
    
    def visit_next_term(self,node,visited_children):
        _,op,_ = visited_children
        return op

    def visit_question_what(self,node,visited_children):
        return ('what',visited_children[-1])
    
    def visit_question_love(self,*args):
        return ('love',True)

    def visit_question(self,node,visited_children):
        return visited_children[0]
    
    def visit_Expression(self,node,visited_children):
        return visited_children[-1]
    
    def generic_visit(self,node,visited_children):
        if node.expr_name:
            return (node.expr_name,visited_children[:])
        elif all(c.expr_name=='next_term' for c in node.children):
            return visited_children
        elif visited_children:
            return visited_children[0]
        else:
            return node.text
    
if __name__ == '__main__':
    import sys
    text = sys.argv[1]
    visitor=HansVisitor()
    result = visitor.parse(text)
    print(': ',result)
