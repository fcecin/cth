#include <eosio/eosio.hpp>
#include <eosio/print.hpp>
using namespace eosio;

//----------------

#include <variant>

struct AStruct {
   int i;
};

struct BStruct {
   bool b;
};

class MyClass {
public:

   // Called when you forgot to write the method for a variant
   template <typename T>
   void othermethod(T& obj) {
      print("unknown type\n");
   }

   void othermethod(int& obj) {
      print("int ", obj, "\n");
   }

   void othermethod(double& obj) {
      print("double ", obj, "\n");
   }

   void othermethod(std::string& obj) {
      print("std::string ", obj, "\n");
   }

   void othermethod(AStruct& obj) {
      print("AStruct ", obj.i, "\n");
   }

   void othermethod(BStruct& obj) {
      print("BStruct ", obj.b, "\n");
   }

   template <typename... Ts>
   void processVariant(std::variant<Ts...>& var) {
      auto visitor = [this](auto&& arg) { this->othermethod(arg); };
      std::visit(visitor, var);
   }
};

CONTRACT gvm : public contract {
public:
    using contract::contract;

    [[eosio::action]]
    void testvar() {
       MyClass obj;
       
       typedef
          std::variant<int, double, std::string, AStruct, BStruct>
          VT;
       
       VT var1 = 42;
       obj.processVariant(var1);
       
       VT var2 = 3.14;
       obj.processVariant(var2);
       
       VT var3 = std::string("Hello");
       obj.processVariant(var3);
       
       VT var4 = AStruct{500};
       obj.processVariant(var4);
       
       VT var5 = BStruct{true};
       obj.processVariant(var5);
    }

    gvm(name receiver, name code, datastream<const char*> ds):
       contract(receiver, code, ds)
    {
    }
};
