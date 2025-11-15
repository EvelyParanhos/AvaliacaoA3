package com.clinicaestetica.schedule.service;
import com.clinicaestetica.schedule.repository.ServicoRepository;
import com.clinicaestetica.schedule.repository.AgendamentoRepository;
import com.clinicaestetica.schedule.repository.EspecialidadeRepository; // <<< IMPORTADO
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.clinicaestetica.schedule.model.Especialidade; 
import com.clinicaestetica.schedule.model.Profissional;
import com.clinicaestetica.schedule.model.Servico;
import com.clinicaestetica.schedule.model.Agendamento; 
import com.clinicaestetica.schedule.enums.StatusAgendamento; 
import java.time.LocalDateTime; 
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors; 
import org.springframework.transaction.annotation.Transactional; 

@Service
public class ServicoService {
    
    @Autowired
    private ServicoRepository servicoRepository;

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @Autowired // <<< INJETADO
    private EspecialidadeRepository especialidadeRepository;

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
        List<Agendamento> agendamentos = agendamentoRepository.findByServicoId(id);
        for (Agendamento agendamento : agendamentos) {
            // Cancela apenas o que não está Concluído ou já Cancelado
            if (agendamento.getStatus() == StatusAgendamento.AGENDADO || agendamento.getStatus() == StatusAgendamento.ALTERADO) {
                agendamento.setStatus(StatusAgendamento.CANCELADO);
                agendamento.setDataCancelamento(LocalDateTime.now());
            }
            // Não setamos mais agendamento.setServico(null)
        }
        agendamentoRepository.saveAll(agendamentos);

        // 2. Desvincular de Especialidades
        // Itera sobre uma cópia para evitar ConcurrentModificationException
        for (Especialidade especialidade : new java.util.HashSet<>(servico.getEspecialidades())) {
            especialidade.getServicos().remove(servico);
            especialidadeRepository.save(especialidade);
        }
        servico.getEspecialidades().clear();
        servicoRepository.save(servico);
        
        // 3. NÃO DELETAMOS O SERVIÇO, APENAS DESATIVAMOS (opcional)
        // Para manter o histórico, não chamamos servicoRepository.delete(servico);
        // Se você REALMENTE quiser deletar, a etapa 1.1 (Agendamento.java) é obrigatória
        // e o seu banco de dados precisa ser atualizado (DROP e CREATE).
        
        // Vamos manter o delete por enquanto, mas a Causa 1.1 é a raiz do erro
        // Tente isto:
        servicoRepository.delete(servico);
    }
    
    // --- MÉTODO ATUALIZAR SERVIÇO (NOVO) ---
    @Transactional
    public Servico atualizarServico(Long id, Servico servicoAtualizado) {
        Servico servicoExistente = servicoRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Serviço com id " + id + " não encontrado para atualização"));

        if (servicoAtualizado.getNome() != null) {
            servicoExistente.setNome(servicoAtualizado.getNome());
        }
        if (servicoAtualizado.getDescricao() != null) {
            servicoExistente.setDescricao(servicoAtualizado.getDescricao());
        }
        if (servicoAtualizado.getPreco() != null) {
            servicoExistente.setPreco(servicoAtualizado.getPreco());
        }
        if (servicoAtualizado.getDuracaoEmMinutos() > 0) {
            servicoExistente.setDuracaoEmMinutos(servicoAtualizado.getDuracaoEmMinutos());
        }
        return servicoRepository.save(servicoExistente);
    }
}