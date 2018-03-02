Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/ctypes.jsm")

var gdi32 = ctypes.open("gdi32.dll");
var user32 = ctypes.open("user32.dll");

var BOOL = ctypes.bool;
var HDC = ctypes.voidptr_t;
var LPVOID = ctypes.voidptr_t;
var WORD = ctypes.unsigned_short;
var PVOID = ctypes.voidptr_t;

var HANDLE = PVOID;
var HWND = HANDLE;

function _GetDC(hwnd) {
  var GetDC = user32.declare('GetDC', ctypes.winapi_abi,
                                      HDC,    //return
                                      HWND    // hWnd
                                    );
  return GetDC(hwnd)
}

function _GetDeviceGammaRamp(hdc, lpRamp) {
  var GetDeviceGammaRamp = gdi32.declare("GetDeviceGammaRamp", ctypes.winapi_abi,
                                                               BOOL,    // return
                                                               HDC,     // hDC
                                                               LPVOID   // lpRamp
                                                              );
  return GetDeviceGammaRamp(hdc, lpRamp)
}

function _SetDeviceGammaRamp(hdc, lpRamp) {
  var SetDeviceGammaRamp = gdi32.declare("SetDeviceGammaRamp", ctypes.winapi_abi,
                                                               BOOL,    // return
                                                               HDC,     // hDC
                                                               LPVOID   // lpRamp
                                                              );
  return SetDeviceGammaRamp(hdc, lpRamp)
}

var hdc = _GetDC(null);
var buf = WORD.array((256) * 3)(); // 3 arrays of 256 WORD elements each.
var lpGamma = buf.address(); // Copy of initial buffer.

_GetDeviceGammaRamp(hdc, buf.address());

var bufferArray;
for (var i = 0; i < 768; i++) {
  if (bufferArray == null) {
    bufferArray = buf[i];
  }
  else {
  bufferArray += "," + buf[i];
  }
}

function LOG(msg) {
  var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService);
  consoleService.logStringMessage(msg);
}

function GammaService() { }

GammaService.prototype = {
  classDescription: "GammaService",
  
  classID:          Components.ID("{33eb56bc-1087-4d59-b2c2-819fcbe4c2c3}"), /* { 0x33eb56bc, 0x1087, 0x4d59, \
    { 0xb2, 0xc2, 0x81, 0x9f, 0xcb, 0xe4, 0xc2, 0xc3 } } */
  contractID:       "@anima-os.com/display/gamma-service;1", // or "@anima-os.com/os/gammaservice;1"?
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIGammaService]),
  hello: function() { return "Hello World!"; },
  add: function(a, b) { return a + b; },
  
  getGamma: function(count, gamma) {
    count.value = buf.length; 
    var gamma = bufferArray.split(",").map(Number); return gamma;
  },
  setGamma: function(count, gamma) { 
    count.value = 768;
    LOG(count.toString());
    LOG(gamma.toString());
    
    buf = WORD.array((256) * 3)(gamma);
    _SetDeviceGammaRamp(hdc, buf.address());
  }
  // setGamma + setGammaArray?
  // setInitialGamma function(gamma) => add gamma values to gammaStore.
  // var gamma = buf.toString().split(",").map(Number)
};

var components = [GammaService];
var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);