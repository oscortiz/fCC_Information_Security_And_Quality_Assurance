/*
*
*
*       Complete the handler logic below
*       
*       
*/

function ConvertHandler() {
  
  // Get Index Of input First Character (if exists)
  this.getIndexOfFirstCharacter = function(input) {
    let regexp = /[A-Za-z]/;
    return input.indexOf(input.match(regexp));    
  }
  
  this.getNum = function(input) {    
    const indexOfFirstCharacter = this.getIndexOfFirstCharacter(input);
    let result = input.substr(0, indexOfFirstCharacter);
    
    if (indexOfFirstCharacter === 0) {
      return 1;
    }  
        
    if (result.includes('/')) {
      // Check if more than one slash (/)
      if (result.indexOf('/') !== result.lastIndexOf('/')) {
        return 'invalid number';
      }  
      // Check correct decimals (if exist)
      let decimalRegexp = /^\d*\.?\d+$/;
      if (result.includes('.') && (!result.split('/')[0].match(decimalRegexp) || !result.split('/')[1].match(decimalRegexp))) {
        return 'invalid number';
      } 
    }
    
    return result;
  };
  
  this.getUnit = function(input) {    
    const indexOfFirstCharacter = this.getIndexOfFirstCharacter(input);
    
    if (indexOfFirstCharacter < 0) {
      return 'invalid unit';
    }    
    
    let units = ['gal','l','mi','km','lbs','kg','GAL','L','MI','KM','LBS','KG'];
    let result = input.substr(indexOfFirstCharacter); 
    
    if (!units.includes(result)) {
      return 'invalid unit';
    }
 
    return result;
  };
  
  this.getReturnUnit = function(initUnit) {
    let units = {
      gal : 'l',
      mi : 'km',
      lbs : 'kg',
      l : 'gal',
      km : 'mi',
      kg : 'lbs'
    };
    
    return units[initUnit.toLowerCase()];
  };

  this.spellOutUnit = function(unit) {
    let units = {
      gal : 'gallons',
      mi : 'miles',
      lbs : 'pounds',
      l : 'liters',
      km : 'kilometers',
      kg : 'kilograms'
    };

    return units[unit.toLowerCase()];
  };
  
  this.convert = function(initNum, initUnit) {
    const galToL = 3.78541;
    const lbsToKg = 0.453592;
    const miToKm = 1.60934;

    switch (initUnit.toLowerCase()) {
      case 'gal':
        return initNum * galToL;
      case 'l':
        return initNum / galToL;
      case 'lbs':
        return initNum * lbsToKg;
      case 'kg':
        return initNum / lbsToKg;
      case 'mi':
        return initNum * miToKm;
      case 'km':
        return initNum / miToKm;        
    }
  };
  
  this.getString = function(initNum, initUnit, returnNum, returnUnit) {
    // Format: {initNum} {initial_Units} converts to {returnNum} {return_Units}
    // with the result rounded to 5 decimals
    if (typeof returnNum == 'number') {
      return `${initNum} ${initUnit} converts to ${returnNum.toFixed(5)} ${returnUnit}`;
    }
    return `${initNum} ${initUnit} converts to ${returnNum} ${returnUnit}`;
  };
  
}

module.exports = ConvertHandler;
