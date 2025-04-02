export interface IStripeOrder  {
	order_items: IOrderItemCreate[],
	order_id: number,
}

export interface IOrderItemCreate {
	product_id: number,
	product_name: string,
	quantity: number,
	unit_price: number
}