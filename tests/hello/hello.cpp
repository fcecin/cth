#include <eosio/eosio.hpp>
#include <eosio/symbol.hpp>

using namespace eosio;
using namespace std;

class [[eosio::contract]] hello : public contract {
public:
   using contract::contract;

   hello( name receiver, name code, datastream<const char*> ds ) :
         contract(receiver, code, ds)
      {
      }

   [[eosio::action]]
   void someaction() {
   }

};
