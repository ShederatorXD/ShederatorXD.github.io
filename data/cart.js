export let cart = JSON.parse(localStorage.getItem('cart'));
if(!cart){
    cart = [
    {
        id:"e43638ce-6aa0-4b85-b27f-e1d07eb678c6",
        deliveryOptionId:1,
        quantity:1
    },
    {
        id:"15b6fc6f-327a-4ec4-896f-486349e85a3d",
        deliveryOptionId:2,
        quantity:2
    }
];
}

function saveCart(){
    localStorage.setItem('cart',JSON.stringify(cart));
}

export function addToCart(productid){
    let matchingitem;
    cart.forEach((item)=>{
        if(productid === item.id)
            matchingitem = item;
    })
    if(matchingitem){
        matchingitem.quantity ++;
    }
    else {
        cart.push({
            id:productid,
            deliveryOptionId:1,
            quantity:1
        })
    }
    saveCart();
}

export function removeFromCart(productid){
    const productId = productid;
    cart.forEach((item)=>{ 
      if(item.id === productId){
        cart.splice(cart.indexOf(item),1);
      }
    })
    saveCart();
}

export function updateDeliveryOption(productid,deliveryOptionId){
    let matchingitem;
    cart.forEach((item)=>{
        if(productid === item.id)
            matchingitem = item;
    })
    matchingitem.deliveryOptionId = deliveryOptionId;
    saveCart();
}   