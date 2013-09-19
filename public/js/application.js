$(document).bind("mobileinit", function () {
    $.mobile.ajaxEnabled = false;
    $.mobile.linkBindingEnabled = false;
    $.mobile.hashListeningEnabled = false;
    $.mobile.pushStateEnabled = false;

    // Remove page from DOM when it's being replaced
    $(document).on('pagehide','div[data-role="page"]', function (event, ui) {
        $(event.currentTarget).remove();
    });
});

$(document).bind("ready", function() {
		Rho.RhoConnectClient.login('user1', 'password');


		var rhoProductModel = Rho.ORM.addModel(function(model) {
				model.modelName("Product");
				// Uncomment for RhoConnect integration
				// model.enable("sync");
				model.property("name", "string");
				model.property("brand", "string");
				model.property("price", "float");
				model.set("partition", "app");
		});

		var Product = RhoTendon.Model.extend({
			ormModel: rhoProductModel,
			mirrorAttributes: ["name", "brand"]
		});

		var ProductList = RhoTendon.ModelCollection.extend({
			model: Product,
		});

		var productList = new ProductList();

		var HomeView = Backbone.View.extend({
			modelCollection: productList,
			events: {
				'click .create_with_rhom' : '_create_with_rhom'
			},
			render: function() {
				var that = this;
				this.modelCollection.fetch({
					success: function(products) {
						var template = _.template($("#product-list-template").html(), {
								products: products.models
							});
						that.$el.html(template);
					}
				});
			},
			_create_with_rhom : function() {
				rhoProductModel.create({ name: "Created from Rhom" });
				router.renderHome();				
			}			
		});

		var ProductEditView = Backbone.View.extend({
			events: {
				'click .save' : 'save'
			},
			mirrorAttributes: ["name", "brand"],
			formHelper: RhoTendon.FormHelper.extend({}),
			render: function(options) {
				var that = this;

				if (options.id) {
					this.product = new Product({id:options.id});
					this.product.fetch({
						success: function(product) {
							that._do_render()
						}
					});
				} else {
					this.product = null;
					this._do_render();
				}
			},
			_do_render: function() {
				var template = _.template($("#product-edit-template").html(), {product:this.product});
				this.$el.html(template);

				this.formHelper.fillForm(this.$el.find("form"), this.product, this.mirrorAttributes);
				
			},
			save: function(ev) {

				var form = $(ev.currentTarget).closest("form");
				var product = this.product || new Product();

				this.formHelper.updateModel(product,form, this.mirrorAttributes);

				product.save({}, {
					success: function(product) {
						router.navigateHome();
					}
				});
				return false;
			}
		});

		var Router = Backbone.Router.extend({

			routes: {
				'': 'home',
				'home' : 'home',
				'new': 'editProduct',
				'edit/:id': 'editProduct',
				'delete/:id': 'deleteProduct'
			},
			changePage: function(page, attributes) {
				$(page.el).attr('data-role', 'page');
				attributes = attributes || {};
		        page.render(attributes);
		        $('body').append($(page.el));
		        
		        var transition = $.mobile.defaultPageTransition;

	        	$.mobile.changePage($(page.el), {changeHash:false, transition: transition});				
			},
			renderHome: function() {
				this.changePage(new HomeView());
			},
			navigateHome: function() {
				router.navigate("home",{trigger:true});
			}

		});

		var router = new Router({});

		router.on('route:home', function() {
			router.renderHome();
		});

		router.on('route:editProduct', function(id) {
			router.changePage(new ProductEditView(), {id:id});
		});

		router.on('route:deleteProduct', function(id) {
			product = productList.get(id);
			product.destroy();
			router.renderHome();
		});


		// Uncomment for RhoConnect integration
		/*
		$(document).on("click",".sync", function() {

				Rho.RhoConnectClient.doSync();
		});
		*/

		$.get("/public/_templates.html", function(data) {
			$("body").append(data);
			Backbone.history.start();
		});
		
	});