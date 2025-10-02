/**
 * PATCH DE MELHORIAS PARA BAILEYS SERVICE
 *
 * Aplicar as seguintes correções no arquivo baileys.service.ts:
 *
 * 1. Validação de formato de telefone (linha 107)
 * 2. Tempo de expiração de 5 minutos (linha 114)
 * 3. Timeout automático para pairing code
 */

// SUBSTITUIR BLOCO DAS LINHAS 106-127 POR:

/*
      // Gerar pairing code se método preferido
      if (preferredMethod === 'code' && phoneNumber) {
        // Validar formato do telefone
        const phoneRegex = /^[1-9]\d{10,14}$/;
        if (!phoneRegex.test(phoneNumber)) {
          throw new Error('Invalid phone number format. Use international format without +: 5511999999999');
        }

        const code = await socket.requestPairingCode(phoneNumber);

        const expiresAt = new Date(Date.now() + 300000).toISOString(); // 5 minutos

        await supabase
          .from('whatsapp_instances')
          .update({
            pairing_code: code,
            pairing_code_expires_at: expiresAt,
            status: 'qr_pending',
          })
          .eq('id', instanceId);

        // Emitir pairing code via Socket.IO
        io.to(`org-${organizationId}`).emit('whatsapp:pairing-code', {
          instanceId,
          code,
          expiresAt,
          timestamp: new Date().toISOString(),
        });

        logger.info({ instanceId, organizationId, code }, 'Pairing code generated and emitted');

        // Timeout de 5 minutos para expirar o código
        setTimeout(async () => {
          const { data: currentInstance } = await supabase
            .from('whatsapp_instances')
            .select('status')
            .eq('id', instanceId)
            .single();

          if (currentInstance?.status === 'qr_pending') {
            await supabase
              .from('whatsapp_instances')
              .update({
                status: 'disconnected',
                pairing_code: null,
              })
              .eq('id', instanceId);

            io.to(`org-${organizationId}`).emit('whatsapp:pairing-code-expired', {
              instanceId,
              timestamp: new Date().toISOString(),
            });

            logger.warn({ instanceId, organizationId }, 'Pairing code expired');
          }
        }, 300000);

        return { success: true, pairingCode: code, method: 'code' };
      }
*/

// VERIFICAR SE JÁ EXISTE:
// - Linha 119-124: Emissão de pairing code via Socket.IO ✅ JÁ IMPLEMENTADO
// - Linha 189-194: Emissão de whatsapp:disconnected ✅ JÁ IMPLEMENTADO
// - Linha 212-217: Emissão de whatsapp:connected ✅ JÁ IMPLEMENTADO

export {};
