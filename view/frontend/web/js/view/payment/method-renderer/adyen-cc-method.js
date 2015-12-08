/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 *
 * Adyen Payment module (https://www.adyen.com/)
 *
 * Copyright (c) 2015 Adyen BV (https://www.adyen.com/)
 * See LICENSE.txt for license details.
 *
 * Author: Adyen <magento@adyen.com>
 */
/*browser:true*/
/*global define*/
define(
    [
        'underscore',
        'jquery',
        'Magento_Payment/js/view/payment/cc-form',
        'Magento_Checkout/js/action/set-payment-information',
        'Adyen_Payment/js/action/place-order',
        'mage/translate',
        'Magento_Checkout/js/model/payment/additional-validators',
        'Magento_Checkout/js/model/full-screen-loader',
        'Adyen_Payment/js/view/payment/adyen-encrypt',
    ],
    function (_, $, Component, setPaymentInformationAction, placeOrderAction, $t, additionalValidators, fullScreenLoader) {
        'use strict';
        return Component.extend({
            defaults: {
                template: 'Adyen_Payment/payment/cc-form',
                creditCardOwner: '',
                encryptedData: ''
            },
            initObservable: function () {
                this._super()
                    .observe([
                        'creditCardType',
                        'creditCardExpYear',
                        'creditCardExpMonth',
                        'creditCardNumber',
                        'creditCardVerificationNumber',
                        'creditCardSsStartMonth',
                        'creditCardSsStartYear',
                        'selectedCardType',
                        'creditCardOwner',
                        'encryptedData',
                        'generationtime'
                    ]);
                return this;
            },
            initialize: function() {

                var self = this;
                this._super();

                // when creditCarNumber change call encrypt function
                this.creditCardNumber.subscribe(function(value) {
                    self.calculateCseKey();
                });
                this.creditCardOwner.subscribe(function(value) {
                    self.calculateCseKey();
                });
                //this.creditCardExpMonth.subscribe(function(value) {
                //    self.calculateCseKey();
                //});
                //this.creditCardExpYear.subscribe(function(value) {
                //    self.calculateCseKey();
                //});
                this.creditCardVerificationNumber.subscribe(function(value) {
                    self.calculateCseKey();
                });

            },
            placeOrderHandler: null,
            validateHandler: null,
            setPlaceOrderHandler: function(handler) {
                this.placeOrderHandler = handler;
            },
            setValidateHandler: function(handler) {
                this.validateHandler = handler;
            },
            getCode: function() {
                return 'adyen_cc';
            },
            getData: function() {
                return {
                    'method': this.item.method,
                    additional_data: {
                        'cc_type': this.creditCardType(),
                        'cc_exp_year': this.creditCardExpYear(),
                        'cc_exp_month': this.creditCardExpMonth(),
                        'cc_number': this.creditCardNumber(),
                        'cc_owner' : this.creditCardOwner(),
                        'cc_cid': this.creditCardVerificationNumber(),
                        'cc_ss_start_month': this.creditCardSsStartMonth(),
                        'cc_ss_start_year': this.creditCardSsStartYear(),
                        'encrypted_data': this.encryptedData(),
                        'generationtime': this.generationtime()
                    }
                };
            },
            isActive: function() {
                return true;
            },
            /**
             * @override
             */
            placeOrder: function() {
                var self = this;

                //var cse_form = $("adyen-cc-form");
                var cse_form = document.getElementById('adyen-cc-form');
                var cse_key = this.getCSEKey();
                //var cse_options = {
                //    name:  'payment[encrypted_data]',
                //    enableValidations: true,
                //    submitButtonAlwaysEnabled: true
                //};
                var options = {};

                var cseInstance = adyen.encrypt.createEncryption(cse_key, options);
                var generationtime = self.getGenerationTime();

                var cardData = {
                    number : self.creditCardNumber(),
                    cvc : self.creditCardVerificationNumber(),
                    holderName : self.creditCardOwner(),
                    expiryMonth : self.creditCardExpMonth(),
                    expiryYear : self.creditCardExpYear(),
                    generationtime : generationtime
                };

                var data = cseInstance.encrypt(cardData);
                self.encryptedData(data);

                // loading icon
                fullScreenLoader.startLoader();


                var placeOrder = placeOrderAction(this.getData(), this.redirectAfterPlaceOrder);

                $.when(placeOrder).fail(function(){
                    self.isPlaceOrderActionAllowed(true);
                    fullScreenLoader.stopLoader();
                });
                //return true;
                //
                //if (this.validateHandler()) {
                //    this.isPlaceOrderActionAllowed(false);
                //    $.when(setPaymentInformationAction()).done(function() {
                //        self.placeOrderHandler();
                //    }).fail(function() {
                //        self.isPlaceOrderActionAllowed(true);
                //    });
                //}
            },
            getControllerName: function() {
                return window.checkoutConfig.payment.iframe.controllerName[this.getCode()];
            },
            getPlaceOrderUrl: function() {
                return window.checkoutConfig.payment.iframe.placeOrderUrl[this.getCode()];
            },
            context: function() {
                return this;
            },
            isCseEnabled: function() {
                return window.checkoutConfig.payment.adyenCc.cseEnabled;
            },
            getCSEKey: function() {
                return window.checkoutConfig.payment.adyenCc.cseKey;
            },
            getGenerationTime: function() {
                return window.checkoutConfig.payment.adyenCc.generationTime;
            },
            isShowLegend: function() {
                return true;
            },
            calculateCseKey: function() {

                //
                ////var cse_form = $("adyen-cc-form");
                //var cse_form = document.getElementById('adyen-cc-form');
                //var cse_key = this.getCSEKey();
                //var cse_options = {
                //    name:  'payment[encrypted_data]',
                //    enableValidations: true, // disable because month needs to be 01 isntead of 1
                //    //submitButtonAlwaysEnabled: true
                //};
                //
                //var result = adyen.encrypt.createEncryptedForm(cse_form, cse_key, cse_options);



            }
        });
    }
);

