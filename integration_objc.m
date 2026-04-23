#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

/**
 * Exemplo de Integração AUTH FFH4X em Objective-C (iOS)
 * Este código demonstra como validar uma key e exibir um alerta no estilo solicitado.
 */

@interface AuthManager : NSObject
- (void)validateKey:(NSString *)licenseKey completion:(void (^)(BOOL success, NSDictionary *data, NSString *errorMsg))completion;
@end

@implementation AuthManager

- (void)validateKey:(NSString *)licenseKey completion:(void (^)(BOOL success, NSDictionary *data, NSString *errorMsg))completion {
    // Configurações da API
    NSString *baseUrl = @"https://authffh4x.up.railway.app/api/v1/validate_key";
    NSString *packageToken = @"PKG-ue2RH41zFXERvXtFMZ6qNfIB4i7q6DL3";
    
    // Gerar um HWID único (Exemplo usando o identificador do fornecedor)
    NSString *hwid = [[[UIDevice currentDevice] identifierForVendor] UUIDString];
    
    // Preparar o corpo da requisição
    NSDictionary *body = @{
        @"key": licenseKey,
        @"hwid": hwid,
        @"package_token": packageToken
    };
    
    NSError *error;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:body options:0 error:&error];
    
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:baseUrl]];
    [request setHTTPMethod:@"POST"];
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    [request setHTTPBody:jsonData];
    
    // Realizar a chamada
    NSURLSessionDataTask *task = [[NSURLSession sharedSession] dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *sessionError) {
        
        dispatch_async(dispatch_get_main_queue(), ^{
            if (sessionError) {
                completion(NO, nil, @"Erro de conexão");
                return;
            }
            
            NSDictionary *jsonResponse = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
            NSString *status = jsonResponse[@"status"];
            
            if ([status isEqualToString:@"success"]) {
                completion(YES, jsonResponse, nil);
            } else {
                NSString *msg = jsonResponse[@"message"] ?: @"Erro desconhecido";
                completion(NO, nil, msg);
            }
        });
    }];
    
    [task resume];
}

@end

// --- Exemplo de uso no ViewController ---

- (void)showLoginAlert {
    UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"AUTH FFH4X"
                                                                   message:@"Insira sua licença abaixo para validar o acesso."
                                                            preferredStyle:UIAlertControllerStyleAlert];
    
    [alert addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = @"Cole sua Key aqui...";
    }];
    
    UIAlertAction *confirmAction = [UIAlertAction actionWithTitle:@"Confirmar Key" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
        NSString *key = alert.textFields.firstObject.text;
        
        AuthManager *auth = [[AuthManager alloc] init];
        [auth validateKey:key completion:^(BOOL success, NSDictionary *data, NSString *errorMsg) {
            if (success) {
                [self showSuccessAlert:data];
            } else {
                [self showErrorAlert:errorMsg];
            }
        }];
    }];
    
    UIAlertAction *cancelAction = [UIAlertAction actionWithTitle:@"Cancelar" style:UIAlertActionStyleCancel handler:nil];
    
    [alert addAction:confirmAction];
    [alert addAction:cancelAction];
    
    [self presentViewController:alert animated:YES completion:nil];
}

- (void)showSuccessAlert:(NSDictionary *)data {
    NSString *msg = [NSString stringWithFormat:@"Status: Key Válida\nExpira em: %@\nDispositivo: Autorizado", data[@"expires_at"]];
    
    UIAlertController *successAlert = [UIAlertController alertControllerWithTitle:@"Successful!"
                                                                           message:msg
                                                                    preferredStyle:UIAlertControllerStyleAlert];
    
    UIAlertAction *okAction = [UIAlertAction actionWithTitle:@"Entrar" style:UIAlertActionStyleDefault handler:nil];
    [successAlert addAction:okAction];
    
    [self presentViewController:successAlert animated:YES completion:nil];
}

- (void)showErrorAlert:(NSString *)errorMsg {
    UIAlertController *errorAlert = [UIAlertController alertControllerWithTitle:@"Erro"
                                                                        message:errorMsg
                                                                 preferredStyle:UIAlertControllerStyleAlert];
    
    UIAlertAction *retryAction = [UIAlertAction actionWithTitle:@"Tentar Novamente" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) {
        [self showLoginAlert];
    }];
    
    [errorAlert addAction:retryAction];
    [self presentViewController:errorAlert animated:YES completion:nil];
}
