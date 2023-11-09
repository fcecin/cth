#include <eosio/eosio.hpp>
#include <eosio/symbol.hpp>

using namespace eosio;
using namespace std;

class [[eosio::contract]] gvm : public contract {
public:
   using contract::contract;

   gvm( name receiver, name code, datastream<const char*> ds ) :
         contract(receiver, code, ds)
      {
      }

   [[eosio::action]]
   void someaction() {
   }

};
