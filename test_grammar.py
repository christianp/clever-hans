from nose.tools import eq_
from grammar import HansVisitor
import math

def eval_equals(input,output):
    input = input.strip().lower()
    visitor = HansVisitor()
    result = visitor.parse(input)
    eq_(result,output)

def what_equals(input,output):
    eval_equals(input,('what',output))

def test_love():
    eval_equals('i love you hans', ('love',True))
    eval_equals('i love you', ('love',True))

def test_atom_number():
    tests = [
        ('5',5),
        ('431',431),
        ('eight',8)
    ]
    for input,output in tests:
        yield what_equals, input, output

def test_atom_unary():
    tests = [
        ('3 squared',9),
        ('3 cubed',27),
        ('3 factorial',6),
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_atom_square_root():
    tests = [
        ('the square root of 9',3),
        ('square root of 25',5),
        ('square root 64',8),
        ('root 6',math.sqrt(6)),
        ('√ 4',2),
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_atom_cube_root():
    tests = [
        ('the cube root of 8',2),
        ('cube root 27',3),
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_atom_root():
    tests = [
        ('the 2nd root of 25',5),
        ('the 5th root of 32',2),
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_atom_function():
    tests = [
        ('the greatest common factor of 12 and 8',4),
        ('gcd of 8 and 12',4),
        ('the biggest number that divides both 36 and 26',2),
        ('least common multiple of 15 and 18',90),
        ('smallest multiple of both 24 and 16',48),
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_op_add():
    tests = [
        ('5 add 4',9),
        ('4+2',6),
        ('6 squared plus 4',40)
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_op_multiply():
    tests = [
        ('5 × 3',15),
        ('4x3',12),
        ('6 times 3',18),
        ('2 multiplied by 4',8),
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_op_subtract():
    tests = [
        ('4-3',1),
        ('2 minus 5',-3),
        ('6 take away 4',2),
        ('13 take-away 3',10),
        ('1 subtract 1',0),
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_op_divide():
    tests = [
        ('6÷2',3),
        ('13 divided by 2',13/2),
        ('1 over 2',1/2),
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_op_power():
    tests = [
        ('3^3',27),
        ('4 to the power of 3',64),
        ('1 to the 6',1),
    ]
    for i,o in tests:
        yield what_equals,i,o

def test_long_expression():
    what_equals('5 plus 16 divided by 2 squared',9)
    what_equals('one plus two times two',5)

def test_what_variants():
    starts = ['what is','what\'s','can you tell me']
    for s in starts:
        yield what_equals,'{} 5'.format(s),5
