function puts(A){if($defined(window.debug)&&window.debug==false){return }if(window.console&&console.log){switch($type(A)){case"object":console.dir(A);break;default:console.log(A)}}if(Browser.Features.air&&air){if(air.Introspector&&air.Introspector.Console){switch($type(A)){case"string":air.Introspector.Console.log(A);break;case"object":air.Introspector.Console.dump(A);break}}else{air.trace(A)}}}var JazzRecord={};JazzRecord.AirAdapter=new Class({Implements:Options,options:{dbFile:"jazz_record.db"},initialize:function(A){this.setOptions(A);this.connection=new air.SQLConnection();this.dbFile=air.File.applicationDirectory.resolvePath(this.options.dbFile);this.connection.open(this.dbFile,air.SQLMode.CREATE);this.statement=new air.SQLStatement();this.statement.sqlConnection=this.connection},run:function(B){puts(B);this.statement.text=B;this.statement.execute();var A=this.statement.getResult();return A.data},count:function(A){puts(A);A=A.toUpperCase();return this.run(A)[0]["COUNT(*)"]},save:function(A){puts(A);this.statement.text=A;this.statement.execute();return this.statement.getResult().lastInsertRowID}});JazzRecord.GearsAdapter=new Class({Implements:Options,options:{dbFile:"jazz_record.db"},initialize:function(A){this.setOptions(A);this.db=google.gears.factory.create("beta.database");this.db.open(this.options.dbFile);this.result=null},run:function(D){puts(D);this.result=this.db.execute(D);var C=[];while(this.result.isValidRow()){var F={};for(var B=0,A=this.result.fieldCount();B<A;B++){var E=this.result.fieldName(B);F[E]=this.result.field(B)}C.push(F);this.result.next()}return C},count:function(A){puts(A);this.result=this.db.execute(A);return this.result.field(0)},save:function(A){puts(A);this.db.execute(A);return this.db.lastInsertRowId}});JazzRecord.depth=3;JazzRecord.models=new Hash();JazzRecord.Record=new Class({Implements:[Options,Events],options:{model:null,columns:{},data:{}},initialize:function(A){this.id=null;this.setOptions(A);this.errors=[];$each(this.options.columns,function(C,B){this[B]=null;if(this.options.data[B]){this[B]=this.options.data[B]}if(C==="bool"){var D=(this[B]?true:false);this.options.data[B]=D;this[B]=D}},this);if(this.options.data.id){this.id=this.options.data.id}},destroy:function(){if(!this.id){throw ("Unsaved record cannot be destroyed")}else{this.fireEvent("destroy");this.options.model.destroy(this.id);this.id=null}},getData:function(B){var A={};if(B==="original"){B=this.options.data}else{B=this}$each(this.options.columns,function(D,C){A[C]=B[C]},this);return A},isChanged:function(){var B=$H(this.getData());var A=$H(this.getData("original"));if(this.id&&B.toQueryString()===A.toQueryString()){return false}else{return true}},save:function(){if(this.isChanged()&&this.isValid()){var C=this.getData();var B=this.getData("original");if(this.id){C.id=this.id;this.fireEvent("update")}C.originalData=B;var A=this.options.model.save(C);if(!this.id){this.id=A;this.fireEvent("create")}$each(this.options.columns,function(E,D){this.options.data[D]=this[D]},this);this.fireEvent("save")}else{puts("Unchanged data")}},revert:function(){$each(this.options.columns,function(B,A){this[A]=this.options.data[A]},this)},reload:function(){if(!this.id){throw ("Unsaved record cannot be reloaded")}else{var A=this.options.model.find(this.id);$extend(this,A)}},load:function(A,B){if(!B){B=0}if(this[A].unloaded){this[A]=this[A].loader(B)}return this[A]},updateAttribute:function(A,B){this[A]=B;this.save()},toString:function(){var A="#<Table: {modelTable} id: {id} {columnStuff}>";var B={modelTable:this.options.model.table,id:this.id};B.columnStuff="";$each(this.options.columns,function(D,C){B.columnStuff+=" "+C+": "+this[C]},this);return A.substitute(B)}});JazzRecord.Model=new Class({Implements:Options,options:{table:"",columns:{},foreignKey:"",hasOne:{},belongsTo:{},hasMany:{},hasAndBelongsToMany:{},events:{},validate:$empty},initialize:function(A){this.setOptions(A);this.table=this.options.table;this.sql="";if(!JazzRecord.models.has(this.table)){JazzRecord.models.set(this.table,this)}},newRecord:function(B){if(!B){B={}}var C={};$each(this.options.columns,function(E,D){C[D]=B[D]||null});var A={model:this,columns:this.options.columns,data:C};$each(this.options.events,function(E,D){A[D]=E});return new JazzRecord.Record(A)},create:function(B){var A=this.newRecord(B);A.save();return A}});var AssociationLoader=new Class({initialize:function(A){this.loader=A;this.unloaded=true},toString:function(){return"Not yet loaded"}});JazzRecord.Model.implement({columnNames:function(){var A="(";$each(this.options.columns,function(C,B){if(B!="id"){A+=B+", "}});A=A.substr(0,A.length-2);return A+")"},columnValues:function(B){var A=" VALUES(";$each(this.options.columns,function(D,C){if(C!="id"){A+=this.typeValue(C,B[C])+", "}},this);A=A.substr(0,A.length-2);return A+")"},typeValue:function(A,B){if(B==null){return"NULL"}else{switch(this.options.columns[A]){case"string":case"text":return"'"+(B||this[A])+"'";case"number":case"int":case"float":return B||this[A];case"bool":if(B||this[A]){return 1}else{return 0}}}}});JazzRecord.Record.implement({pushError:function(B,A){message=B;if($defined(A)&&A!=""){message=A}this.errors.push(message)},parseVars:function(A){},validate:function(){this.options.model.options.validate.apply(this)},isValid:function(){this.validate();if(this.errors.length!=0){return false}else{return true}},validatesAcceptanceOf:function(B,A){if(B==false||B==0){if(!$defined(A)){customMsg="must be abided"}this.errors.push(A);return false}return true},validatesAssociated:function(D,C){var E=true;var B=JazzRecord.models.get(this[D]);var A=B.foreignKey;if(this[D].unloaded){if(!B.find(this[A])){E=false}}else{if(!this[D].id){E=false}}if(!$defined(C)){C=D+" does not exist with ID "+this[A]}if(!E){this.errors.push(C)}return E},validatesConfirmationOf:function(C,B,A){if(C!=B){if(!$defined(A)){A="does not match"}this.errors.push(A);return false}else{return true}},validatesExclusionOf:function(D,A,C){var B=true;$each(A,function(E){if(D.contains(E)){B=false;if(!$defined(C)){C=D+" must not contain "+E}this.errors.push(C)}return B})},validatesFormatOf:function(){},validatesInclusionOf:function(D,A,C){var B=false;$each(A,function(E){if(D.contains(E)){B=true}});if(!B){if(!$defined(C)){C=D+" must contain "+cur_Word}this.errors.push(C)}return B},validatesLengthOf:function(D,B,A,C){if((D.length)>A||(D.length)<B){if(!$defined(C)){C="must be between "+B+" and "+A}this.errors.push(C);return false}else{return true}},validatesNumericalityOf:function(B,A){if(validatesIsInt(B)||validatesIsFloat(B)){return true}else{if(!$defined(A)){A="must be numeric"}this.errors.push(A);return false}},validatesPresenceOf:function(B,A){if(!$defined(B)||B==""){if(!$defined(A)){A="must be defined"}this.errors.push(A);return false}else{return true}},validatesUniquenessOf:function(A,C,B){if(findBy(A,C).length>0){if(!$defined(B)){B="is not unique"}this.errors.push(B);return false}else{return true}},validateIsString:function(B,A){if(typeof (B)=="string"){return true}if(!$defined(A)){A="must be string"}this.errors.push(A);return false},validateIsBool:function(B,A){if(typeof (B)=="boolean"){return true}if(!$defined(A)){A="must be boolean"}this.errors.push(A);return false},validateIsInt:function(B,A){if(typeof (B)=="number"){return true}if(!$defined(A)){A="must be int"}this.errors.push(A);return false},validateIsFloat:function(A){if((typeof (A)=="number")&&(A.contains("."))){return true}if(!$defined(errText)){errText="must be boolean"}this.errors.push(errText);return false}});JazzRecord.Model.implement({query:function(C){if(!$defined(C)){C={}}if(!$defined(C.depth)){C.depth=JazzRecord.depth}var E=C.depth-1;if(E<0){E=0}var A=this.sql;var D=JazzRecord.adapter.run(A);if(!D||D.length==0){if(!(this.sql.contains("DELETE")||this.sql.contains("DROP"))){puts("Found Nothing")}return D}var B=[];$each(D,function(H){var G={model:this,columns:this.options.columns,data:H};$each(this.options.events,function(J,I){G[I]=J});var F=new JazzRecord.Record(G);$each(this.options.hasOne,function(M,L){var K=JazzRecord.models.get(M);var I=K.options.foreignKey;if(F[I]){var J=function(N){return K.first({id:F[I],depth:N})};if(C.depth<1){F[L]=new AssociationLoader(J)}else{F[L]=J(E)}}});$each(this.options.hasMany,function(M,L){var J=JazzRecord.models.get(M);var I=this.options.foreignKey;var K=function(N){return J.findAllBy(I,H.id,N)};if(C.depth<1){F[L]=new AssociationLoader(K)}else{F[L]=K(E)}},this);$each(this.options.belongsTo,function(L,K){var J=JazzRecord.models.get(L);var I=J.options.foreignKey;if(F[I]){var M=function(N){return J.first({id:F[I],depth:N})};if(C.depth<1){F[K]=new AssociationLoader(M)}else{F[K]=M(E)}}});$each(this.options.hasAndBelongsToMany,function(O,N){var I=[this.table,O].sort().toString().replace(",","_");var M="SELECT * FROM "+I+" WHERE "+this.options.foreignKey+" = "+F.id;F[N]=JazzRecord.adapter.run(M);var K=JazzRecord.models.get(O);var J=K.options.foreignKey;if(J){var L=function(P){return K.find({id:F[N][J],depth:P})};if(C.depth<1){F[N]=new AssociationLoader(L)}else{F[N]=L(E)}}},this);B.push(F)},this);if(A.contains("LIMIT 1")){return B[0]}else{return B}}});JazzRecord.Model.implement({save:function(B){this.sql="{saveMode} {table} {set} {data} {conditions};";var A={saveMode:"INSERT INTO",table:this.table,data:this.columnNames()+this.columnValues(B)};var C={};if(B.id){C.id=B.id;C.saveMode="UPDATE";C.set="SET";C.conditions="WHERE id="+B.id;C.data="";$each(this.options.columns,function(E,D){C.data+=D+" = "+this.typeValue(D,B[D])+", "},this);C.data=C.data.slice(0,-2)}C=$extend(A,C);this.sql=this.sql.substitute(C).clean();return JazzRecord.adapter.save(this.sql)}});JazzRecord.Model.implement({destroy:function(B){var A="";if($type(B)==="number"){A="WHERE id="+B}else{if($type(B)==="array"){A="WHERE id IN ("+B+")"}}this.sql="DELETE FROM "+this.table+" "+A;this.query()},destroyAll:function(){this.sql="DELETE FROM "+this.table;this.query()},dropTable:function(){this.sql="DROP TABLE IF EXISTS "+this.table;this.query()}});JazzRecord.Model.implement({find:function(A){if(!$defined(A)){throw ("Missing ID or Options")}else{switch($type(A)){case"array":A={id:A};break;case"number":A={id:A,limit:1};break;case"object":break;default:throw ("Type Error. Model.find() expects Number, Array or Object")}}return this.select(A)},findBy:function(B,A,C){if(!this.options.columns[B]){throw ("Column "+B+" Does Not Exist in Table "+this.table)}else{return this.select({conditions:B+"="+this.typeValue(B,A),limit:1,depth:C})}},findAllBy:function(B,A,C){if(!this.options.columns[B]){throw ("Column "+B+" Does Not Exist in Table "+this.table)}else{return this.select({conditions:B+"="+this.typeValue(B,A),depth:C})}},all:function(A){return this.select(A)},first:function(A){A=$extend({limit:1},A);return this.select(A)},last:function(A){A=$extend({limit:1,order:"id"},A);A.order+=" DESC";return this.select(A)},count:function(A){this.sql="SELECT COUNT(*) FROM "+this.table;if(A){this.sql+=" WHERE "+A}return JazzRecord.adapter.count(this.sql)},select:function(B){if(!B){B={}}this.sql="SELECT {select} FROM "+this.table+" {conditions} {order} {limit} {offset}";var A={select:"*"};B=$extend(A,B);if(!B.select=="*"&&!B.select.contains("id")){B.select="id, "+B.select}if(B.order){B.order="ORDER BY "+B.order}if($type(B.limit)=="number"){B.limit="LIMIT "+B.limit}if($type(B.offset)=="number"){B.offset="OFFSET "+B.offset}if(B.conditions){B.conditions="WHERE "+B.conditions;if(B.id){B.conditions+=" AND id="+B.id}}else{if(B.id){if($type(B.id)=="number"){B.conditions="WHERE id="+B.id;B.limit="LIMIT 1"}else{if($type(B.id)=="array"){B.conditions="WHERE id IN ("+B.id+")"}}}}this.sql=this.sql.substitute(B).clean()+";";return this.query(B)}});JazzRecord.Migration={setup:function(){this.createTable("schema_migrations",{version:"text"});if(JazzRecord.adapter.count("SELECT COUNT(*) FROM schema_migrations")==0){var A="INSERT INTO schema_migrations (version) VALUES(0)";JazzRecord.adapter.run(A)}},current:function(){var A="SELECT version FROM schema_migrations LIMIT 1";return JazzRecord.adapter.run(A)[0].version},update:function(A){var B="UPDATE schema_migrations SET version = "+A;JazzRecord.adapter.run(B)},createTable:function(A,B){if(!($defined(A)&&$defined(B))){return }var C="CREATE TABLE IF NOT EXISTS "+A;if(B){C+="(";$each(B,function(E,D){C+=(D+" "+E.toUpperCase()+", ")});C=C.substr(0,C.length-2);C+=")";JazzRecord.adapter.run(C)}},dropTable:function(A){var B="DROP TABLE "+A;JazzRecord.adapter.run(B)},renameTable:function(B,A){var C="ALTER TABLE "+B+" RENAME TO "+A;JazzRecord.adapter.run(C)},addColumn:function(C,B,A){var D="ALTER TABLE "+C+" ADD COLUMN "+B+" "+A.toUpperCase();JazzRecord.adapter.run(D)},removeColumn:function(D,C){D=JazzRecord.models[D].table;if(!D||!JazzRecord.models[D].options.columns[C]){return }var A="temp_"+D;var B=[];$each(JazzRecord.models[D].options.columns,function(F,E){if(E!=C){B.push({tempColumnName:E})}});alert(B.toSource());JazzRecord.Migration.createTable(A,B);JazzRecord.Migration.dropTable(D);JazzRecord.Migration.renameTable(A,D);JazzRecord.Migration.dropTable(A)},renameColumn:function(B,A){},changeColumn:function(B,A,C){}};JazzRecord.migrate=function(E){if(!E){E={}}if(!E.migrations){var G=[]}if(G.length>0){JazzRecord.Migration.setup();var H=JazzRecord.Migration.current();var C=G.length-1;if(E.version){C=E.version}if(C==H){puts("Up to date");return }for(var F=H,D=C;(C>H)?(F<D):(F>D);(C>H)?F++:F--){var A=G[F];A=(C>H)?A.up:A.down;var B=A[0];switch(A.length){case 4:JazzRecord.Migration[B](A[1],A[2],A[3]);break;case 3:JazzRecord.Migration[B](A[1],A[2]);break;case 2:JazzRecord.Migration[B](A[1])}JazzRecord.Migration.update(F)}}else{if(E.refresh){this.models.each(function(I){I.dropTable();$each(I.options.hasAndBelongsToMany,function(L){var J=[I.table,L].sort().toString().replace(",","_");var K="DROP TABLE IF EXISTS "+J;JazzRecord.adapter.run(K)})})}this.models.each(function(I){var J="CREATE TABLE IF NOT EXISTS "+I.table+"(id INTEGER PRIMARY KEY AUTOINCREMENT";$each(I.options.columns,function(L,K){J+=(", "+K+" "+L.toUpperCase())});J+=")";JazzRecord.adapter.run(J);$each(I.options.hasAndBelongsToMany,function(Q,L){var K=[I.table,Q].sort().toString().replace(",","_");var M=I.options.foreignKey;var N=JazzRecord.models.get(Q).options.foreignKey;var O=[M,N].sort();var P="CREATE TABLE IF NOT EXISTS "+K+"("+O[0]+" INTEGER, "+O[1]+" INTEGER)";JazzRecord.adapter.run(P)})})}if(E.fixtures){this.loadFixtures(E.fixtures)}};JazzRecord.loadFixtures=function(A){$each(A.tables,function(C,B){$each(C,function(D){JazzRecord.models.get(B).create(D)})});if(!A.mappingTables){return }$each(A.mappingTables,function(C,B){$each(C,function(F){var D=$H(F);var E="INSERT INTO "+B+" ("+D.getKeys().toString()+") VALUES("+D.getValues().toString()+")";JazzRecord.adapter.run(E)})})};