export const deliveryOptions = [
  {
    id: 1,
    days:7,
    pricecent: 0
  },
  {
    id: 2,
    days:3,
    pricecent: 499
  },
  {
    id: 3,
    days:1,
    pricecent: 999
  }
];

export function getDeliveryOptionById(id){
  let deliveryOption;
  deliveryOptions.forEach((option)=>{
    if(option.id === id)
      deliveryOption = option;
  })
  return deliveryOption || deliveryOptions[0];
} 