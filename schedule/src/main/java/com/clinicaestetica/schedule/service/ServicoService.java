package com.clinicaestetica.schedule.service;
import com.clinicaestetica.schedule.repository.ServicoRepository;
import com.clinicaestetica.schedule.repository.AgendamentoRepository; // IMPORTADO
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.clinicaestetica.schedule.model.Especialidade; 
import com.clinicaestetica.schedule.model.Profissional;
import com.clinicaestetica.schedule.model.Servico;
import com.clinicaestetica.schedule.model.Agendamento; // IMPORTADO
import com.clinicaestetica.schedule.enums.StatusAgendamento; // IMPORTADO
import java.time.LocalDateTime; // IMPORTADO
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors; 
import org.springframework.transaction.annotation.Transactional; 

@Service
public class ServicoService {
    
    @Autowired
    private ServicoRepository servicoRepository;

    // INJETADO O REPOSITÓRIO DE AGENDAMENTO
    @Autowired
    private AgendamentoRepository agendamentoRepository;

    public List<Servico> listarServicos() {
        return servicoRepository.findAll();
    }

    public List<Profissional> getProfissionaisPorServico(Long id) {
        Servico servico = servicoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Serviço com ID " + id + " não encontrado"));

        return servico.getEspecialidades().stream()
                .flatMap(especialidade -> especialidade.getProfissionais().stream())
                .distinct() 
                .collect(Collectors.toList()); 
    }

    public Servico criarServico(Servico servico) {
        return servicoRepository.save(servico);
    }

    public Servico getServico(Long id) { 
         return servicoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Serviço com ID " + id + " não encontrado"));
    }

    // --- MÉTODO DELETAR CORRIGIDO ---
    @Transactional
    public void deletarServico(Long id) {
        Servico servico = servicoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Serviço com ID " + id + " não encontrado para exclusão"));

        // 1. CANCELAR Agendamentos futuros vinculados
        // (Adicione o método findByServicoId ao AgendamentoRepository - veja próximo ficheiro)
        List<Agendamento> agendamentos = agendamentoRepository.findByServicoId(id);
        for (Agendamento agendamento : agendamentos) {
            // Cancela apenas o que não está Concluído ou já Cancelado
            if (agendamento.getStatus() == StatusAgendamento.AGENDADO || agendamento.getStatus() == StatusAgendamento.ALTERADO) {
                agendamento.setStatus(StatusAgendamento.CANCELADO);
                agendamento.setDataCancelamento(LocalDateTime.now());
            }
        }
        agendamentoRepository.saveAll(agendamentos);

        // 2. Desvincular de Especialidades (como pedido)
        for (Especialidade especialidade : servico.getEspecialidades()) {
            especialidade.getServicos().remove(servico);
        }
        servico.getEspecialidades().clear();
        
        // 3. Agora podemos deletar o serviço
        servicoRepository.delete(servico);
    }
}