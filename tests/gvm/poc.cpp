#include <iostream>
#include <tuple>
#include <functional>

template <typename... Structs>
class B {
public:
   B(Structs&... args) : data_(std::make_tuple(std::ref(args)...)) {}

   int get(int si, int fi) const {
      return getHelper(si, fi, std::make_index_sequence<sizeof...(Structs)>());
   }

   void set(int si, int fi, int value) {
      setHelper(si, fi, value, std::make_index_sequence<sizeof...(Structs)>());
   }

   void print(int si, int fi) const {
      printHelper(si, fi, std::make_index_sequence<sizeof...(Structs)>());
   }

private:
   template <std::size_t... Is>
   int getHelper(int si, int fi, std::index_sequence<Is...>) const {
      int result = 0;
      ((si == Is ? (result = getField(fi, std::get<Is>(data_))), 0 : 0), ...);
      return result;
   }

   template <typename StructType>
   int getField(int fi, StructType& s) const {
      return getFieldValue(s, fi);
   }

   // -------------------

   template <typename StructType>
   void setField(int fi, StructType& s, int value) {
      setFieldValue(s, fi, value);
   }

   template <std::size_t... Is>
   void setHelper(int si, int fi, int value, std::index_sequence<Is...>) {
      ((si == Is ? setField(fi, std::get<Is>(data_), value) : void()), ...);
   }

   // -------------------

   template <std::size_t... Is>
   void printHelper(int si, int fi, std::index_sequence<Is...>) const {
      ((si == Is ? printField(fi, std::get<Is>(data_)) : void()), ...);
   }

   template <typename StructType>
   void printField(int fi, StructType& s) const {
      std::cout << getFieldValue(s, fi) << std::endl;
   }

   // -------------------

   template <typename StructType>
   int getFieldValue(StructType& s, int fi) const {
      return get(s)._getField(fi);
   }

   template <typename StructType>
   void setFieldValue(StructType& s, int fi, int value) {
      get(s)._setField(fi, value);
   }

   template <typename T>
   T& get(std::reference_wrapper<T>& ref) const {
      return ref.get();
   }

   template <typename T>
   const T& get(const std::reference_wrapper<T>& ref) const {
      return ref.get();
   }

   std::tuple<std::reference_wrapper<Structs>...> data_;
};

struct R {
   int x;
   int y;

   R() : x(0), y(0) {}

   int _getField(int index) const {
      switch (index) {
      case 0: return x;
      case 1: return y;
      }
      return 0;
   }

   void _setField(int index, int value) {
      switch (index) {
      case 0: x = value; break;
      case 1: y = value; break;
      }
   }

private: // non-copyable
   R(const R&);
   R& operator=(const R&);
   R(R&&);
   R& operator=(R&&);
};

struct S {
   int a;
   int b;
   int c;

   S() : a(0), b(0), c(0) {}

   int _getField(int index) const {
      switch (index) {
      case 0: return a;
      case 1: return b;
      case 2: return c;
      }
      return 0;
   }

   void _setField(int index, int value) {
      switch (index) {
      case 0: a = value; break;
      case 1: b = value; break;
      case 2: c = value; break;
      }
   }

private: // non-copyable
   S(const S&);
   S& operator=(const S&);
   S(S&&);
   S& operator=(S&&);
};

int main() {
   R r;
   r.x = 1;
   r.y = 2;

   S s;
   s.a = 3;
   s.b = 4;
   s.c = 5;

   // This is not a copy. r and s are passed by reference.
   B<R, S> b(r, s);

   std::cout << "Using B.print\n";

   b.print(0, 0);  // Print r.x == 1
   b.print(1, 1);  // Print s.b == 4

   std::cout << "Using B.get\n";

   int result1 = b.get(0, 1);  // Get r.y == 2
   std::cout << "Result 1: " << result1 << std::endl;
   int result2 = b.get(1, 0);  // Get s.a == 3
   std::cout << "Result 2: " << result2 << std::endl;

   std::cout << "Using B.set\n";

   b.set(1, 2, 555);
   b.print(1, 2); // should print 555, not 5

   return 0;
}
