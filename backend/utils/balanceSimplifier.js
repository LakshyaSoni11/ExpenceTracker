import mongoose from "mongoose";

export const simplifyBalances = (balances) =>{
    const net ={};
    balances.forEach(({from, to, each}) => {
        net[from] = (net[from] || 0) - amount;
        net[to] = (net[to] || 0) + amount;
    });
    return net;
}