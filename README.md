# E-mail Classifier

E-mail Classifier é uma aplicação web desenvolvida com o intuito de classificar e-mails utilizando técnicas de machine learning para melhorar a organização e a eficiência no gerenciamento de mensagens. Os e-mails são classificados em 2 categorias: Produtivo e Improdutivo.

## Funcionalidades
- Classificação automática de e-mails
- Interface intuitiva e fácil de usar
- Carregamento de e-mails através de arquivo
- Carregamento manual de e-mails
- Treinamento personalizado para classificação
- Respostas automáticas
- Personalização de respostas e classificadores

# Usagem
O projeto está disponível on-line [aqui](https://emailclassifier.ravsil.me), mas também é possível executá-lo localmente. Para isso, clone o repositório com o comando:

```git clone git@github.com:ravsil/email-classifier.git```

Dentro da pasta gerada, inicialize um servidor web para servir os arquivos, você pode utilizar python por exemplo com o comando:

```python3 -m http.server 8000```

Após isso, clique no link gerado no terminal

**NOTA:** Caso não possua um arquivo `.mbox`, [uma amostra está disponível aqui](https://github.com/ravsil/email-classifier/blob/main/assets/sample.mbox)